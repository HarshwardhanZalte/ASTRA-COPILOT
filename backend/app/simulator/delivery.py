"""Event-time-aware buffering for delayed and reordered telemetry packets."""

import heapq
from datetime import datetime


class TelemetryDeliveryBuffer:
    def __init__(self, max_pending: int = 500):
        self._pending: list[tuple[float, int, float, dict]] = []
        self._sequence = 0
        self._max_pending = max_pending
        self.latest_event_time: datetime | None = None
        self.delayed_count = 0
        self.out_of_order_count = 0

    @property
    def pending_count(self) -> int:
        return len(self._pending)

    def enqueue(self, telemetry: dict, delay_seconds: float, now: float) -> int:
        if delay_seconds < 0:
            raise ValueError("Telemetry delay cannot be negative")
        if len(self._pending) >= self._max_pending:
            raise OverflowError("Telemetry delivery buffer is full")

        sequence = self._sequence
        self._sequence += 1
        packet_delay = delay_seconds
        if delay_seconds > 0:
            self.delayed_count += 1
            if sequence % 5 == 0:
                packet_delay *= 2
        heapq.heappush(
            self._pending,
            (now + packet_delay, sequence, now, dict(telemetry)),
        )
        return sequence

    def pop_ready(
        self,
        now: float,
        received_at: datetime | None = None,
    ) -> list[dict]:
        received_at = received_at or datetime.utcnow()
        packets = []
        while self._pending and self._pending[0][0] <= now:
            _, sequence, _, telemetry = heapq.heappop(self._pending)
            event_time = datetime.fromisoformat(telemetry["timestamp"])
            out_of_order = (
                self.latest_event_time is not None
                and event_time < self.latest_event_time
            )
            if out_of_order:
                self.out_of_order_count += 1
            elif (
                self.latest_event_time is None
                or event_time > self.latest_event_time
            ):
                self.latest_event_time = event_time

            telemetry["delivery_quality"] = {
                "sequence": sequence,
                "received_at": received_at.isoformat(),
                "latency_seconds": round(
                    max(0.0, received_at.timestamp() - event_time.timestamp()),
                    3,
                ),
                "status": "OUT_OF_ORDER" if out_of_order else "IN_ORDER",
            }
            telemetry.setdefault("data_quality", {})["delivery"] = (
                "OUT_OF_ORDER" if out_of_order else "IN_ORDER"
            )
            packets.append(telemetry)
        return packets

    def clear(self) -> None:
        self._pending.clear()
        self._sequence = 0
        self.latest_event_time = None
        self.delayed_count = 0
        self.out_of_order_count = 0
