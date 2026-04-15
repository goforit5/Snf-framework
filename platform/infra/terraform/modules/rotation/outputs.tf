# =============================================================================
# Rotation Module — Outputs
# =============================================================================

output "lambda_arns" {
  description = "ARNs of the rotation Lambda functions"
  value = {
    pcc     = aws_lambda_function.rotate["pcc"].arn
    workday = aws_lambda_function.rotate["workday"].arn
    m365    = aws_lambda_function.rotate["m365"].arn
  }
}

output "alarm_arns" {
  description = "ARNs of the CloudWatch alarms for rotation failures"
  value = {
    pcc     = aws_cloudwatch_metric_alarm.rotation_failure["pcc"].arn
    workday = aws_cloudwatch_metric_alarm.rotation_failure["workday"].arn
    m365    = aws_cloudwatch_metric_alarm.rotation_failure["m365"].arn
  }
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for rotation alert notifications"
  value       = aws_sns_topic.rotation_alerts.arn
}
