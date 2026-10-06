import unittest

from app.ml import evaluation


class EvaluationTests(unittest.TestCase):
    def test_binary_metrics_and_false_alert_rate_use_nominal_denominator(self):
        result = evaluation.calculate_binary_metrics(
            [False, False, True, True],
            [False, True, False, True],
        )

        self.assertEqual(result["precision"], 0.5)
        self.assertEqual(result["recall"], 0.5)
        self.assertEqual(result["f1"], 0.5)
        self.assertEqual(result["false_alert_rate"], 0.5)
        self.assertEqual(result["confusion_matrix"]["matrix"], [[1, 1], [1, 1]])

    def test_holdout_report_uses_separate_labeled_synthetic_samples(self):
        evaluation._evaluation_cache = None

        result = evaluation.evaluate_detector()

        self.assertEqual(result["dataset"], "synthetic_holdout")
        self.assertEqual(result["training_samples"], 1000)
        self.assertEqual(result["test_samples"], 500)
        self.assertEqual(result["class_counts"]["normal"], 100)
        self.assertEqual(len(result["per_fault_detection"]), 4)
        matrix = result["confusion_matrix"]
        self.assertEqual(result["false_alert_rate"], round(matrix["fp"] / 100, 4))
        self.assertIn("not a real-mission dataset", result["warning"])


if __name__ == "__main__":
    unittest.main()
