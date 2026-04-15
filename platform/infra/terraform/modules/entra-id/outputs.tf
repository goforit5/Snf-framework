# =============================================================================
# Entra ID Module — Outputs
# =============================================================================

output "sso_client_id" {
  description = "Application (client) ID for the SSO app registration"
  value       = azuread_application.sso.client_id
}

output "graph_api_client_id" {
  description = "Application (client) ID for the Graph API service app registration"
  value       = azuread_application.graph_api.client_id
}

output "tenant_id" {
  description = "Azure AD tenant ID"
  value       = data.azuread_client_config.current.tenant_id
}

output "sso_app_object_id" {
  description = "Object ID of the SSO app registration (for role assignment scripts)"
  value       = azuread_application.sso.object_id
}

output "graph_api_app_object_id" {
  description = "Object ID of the Graph API app registration"
  value       = azuread_application.graph_api.object_id
}

output "sso_service_principal_id" {
  description = "Service principal object ID for SSO app"
  value       = azuread_service_principal.sso.object_id
}

output "graph_api_service_principal_id" {
  description = "Service principal object ID for Graph API app"
  value       = azuread_service_principal.graph_api.object_id
}
