# SES Domain Verification Record
output "ses_verification_record" {
  description = "TXT record that needs to be added to domain DNS settings to verify SES domain ownership"
  value = {
    name  = "_amazonses.${var.ses_email_identity}"
    type  = "TXT"
    value = aws_ses_domain_identity.main.verification_token
  }
}

# SES MX Records
output "ses_mx_records" {
  description = "MX records that need to be added to domain DNS settings for receiving emails"
  value = [
    {
      name  = var.ses_email_identity
      type  = "MX"
      value = "10 inbound-smtp.${var.aws_region}.amazonaws.com"
    }
  ]
}

# SES DKIM Records
output "ses_dkim_records" {
  description = "CNAME records that need to be added to domain DNS settings for DKIM verification"
  value = [
    for token in aws_ses_domain_dkim.main.dkim_tokens : {
      name  = "${token}._domainkey.${var.ses_email_identity}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

# S3 Bucket Name
output "email_storage_bucket" {
  description = "Name of the S3 bucket where emails will be stored"
  value       = aws_s3_bucket.email_storage.id
}
