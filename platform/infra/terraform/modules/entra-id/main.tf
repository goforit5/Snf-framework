# =============================================================================
# Entra ID Module — Azure AD App Registrations
# =============================================================================
# Creates two app registrations:
#   1. SSO app — user-facing authentication with RBAC roles
#   2. Graph API app — service-to-service for M365 data access
#
# HIPAA Compliance:
# - Role-based access control (9 roles matching platform UserRole type)
# - Delegated User.Read for SSO (minimal privilege)
# - Application-level Graph API permissions with admin consent
# - No implicit grant flows (authorization code only)
# =============================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # App roles matching the platform UserRole type in @snf/core.
  # UUIDs are deterministic per role — generated once and pinned.
  app_roles = [
    {
      id           = "a1b2c3d4-0001-4000-8000-000000000001"
      display_name = "Administrator"
      description  = "Full platform access — all facilities, all agents, all actions"
      value        = "administrator"
    },
    {
      id           = "a1b2c3d4-0002-4000-8000-000000000002"
      display_name = "Director of Nursing"
      description  = "Clinical domain access — resident data, care plans, pharmacy, infection control"
      value        = "don"
    },
    {
      id           = "a1b2c3d4-0003-4000-8000-000000000003"
      display_name = "Chief Financial Officer"
      description  = "Financial domain access — billing, AR, treasury, budgets, PDPM optimization"
      value        = "cfo"
    },
    {
      id           = "a1b2c3d4-0004-4000-8000-000000000004"
      display_name = "Chief Executive Officer"
      description  = "Enterprise-wide read access — all domains, strategic intelligence, board reports"
      value        = "ceo"
    },
    {
      id           = "a1b2c3d4-0005-4000-8000-000000000005"
      display_name = "Regional Director"
      description  = "Multi-facility access — portfolio view, regional benchmarks, facility comparisons"
      value        = "regional_director"
    },
    {
      id           = "a1b2c3d4-0006-4000-8000-000000000006"
      display_name = "Compliance Officer"
      description  = "Compliance and legal domain — regulatory filings, audit trails, incident reports"
      value        = "compliance_officer"
    },
    {
      id           = "a1b2c3d4-0007-4000-8000-000000000007"
      display_name = "IT Admin"
      description  = "Platform administration — agent configuration, connector health, system settings"
      value        = "it_admin"
    },
    {
      id           = "a1b2c3d4-0008-4000-8000-000000000008"
      display_name = "Auditor"
      description  = "Read-only audit access — audit trail, agent logs, decision history (no actions)"
      value        = "auditor"
    },
    {
      id           = "a1b2c3d4-0009-4000-8000-000000000009"
      display_name = "Read Only"
      description  = "Read-only dashboard access — view all data, no approve/escalate/override actions"
      value        = "read_only"
    },
  ]
}

# =============================================================================
# Data source: current Azure AD tenant
# =============================================================================

data "azuread_client_config" "current" {}

# =============================================================================
# 1. SSO App Registration — snf-platform-sso
# =============================================================================

resource "azuread_application" "sso" {
  display_name = "${local.name_prefix}-sso"
  owners       = [data.azuread_client_config.current.object_id]

  sign_in_audience = "AzureADMyOrg"

  web {
    redirect_uris = [
      "https://goforit5.github.io/Snf-framework/auth/callback",
      "http://localhost:5173/auth/callback",
    ]

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = false
    }
  }

  # Delegated permission: User.Read (sign-in and read user profile)
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read (delegated)
      type = "Scope"
    }
  }

  # RBAC app roles — one per UserRole in the platform
  dynamic "app_role" {
    for_each = local.app_roles
    content {
      allowed_member_types = ["User"]
      description          = app_role.value.description
      display_name         = app_role.value.display_name
      enabled              = true
      id                   = app_role.value.id
      value                = app_role.value.value
    }
  }

  tags = ["SNF Platform", var.environment, "SSO"]
}

resource "azuread_service_principal" "sso" {
  client_id                    = azuread_application.sso.client_id
  app_role_assignment_required = true
  owners                       = [data.azuread_client_config.current.object_id]

  tags = ["SNF Platform", var.environment, "SSO"]
}

# =============================================================================
# 2. Graph API App Registration — snf-platform-graph-api
# =============================================================================

resource "azuread_application" "graph_api" {
  display_name = "${local.name_prefix}-graph-api"
  owners       = [data.azuread_client_config.current.object_id]

  sign_in_audience = "AzureADMyOrg"

  # Application-level permissions for service-to-service Graph API access
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "810c84a8-4a9e-49e6-bf7d-12d183f40d01" # Mail.Read (application)
      type = "Role"
    }

    resource_access {
      id   = "798ee544-9d2d-430c-a058-570e29e34338" # Calendars.Read (application)
      type = "Role"
    }

    resource_access {
      id   = "332a536c-c7ef-4017-ab91-336970924f0d" # Sites.Read.All (application)
      type = "Role"
    }

    resource_access {
      id   = "df021288-bdef-4463-88db-98f22de89214" # User.Read.All (application)
      type = "Role"
    }
  }

  tags = ["SNF Platform", var.environment, "Graph API"]
}

resource "azuread_service_principal" "graph_api" {
  client_id = azuread_application.graph_api.client_id
  owners    = [data.azuread_client_config.current.object_id]

  tags = ["SNF Platform", var.environment, "Graph API"]
}

# Look up the Microsoft Graph service principal in the tenant.
# Admin consent grants are app role assignments where the Graph SP is the resource.
data "azuread_service_principal" "msgraph" {
  client_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
}

# Admin consent for application-level Graph API permissions
resource "azuread_app_role_assignment" "graph_mail_read" {
  app_role_id         = "810c84a8-4a9e-49e6-bf7d-12d183f40d01"
  principal_object_id = azuread_service_principal.graph_api.object_id
  resource_object_id  = data.azuread_service_principal.msgraph.object_id
}

resource "azuread_app_role_assignment" "graph_calendars_read" {
  app_role_id         = "798ee544-9d2d-430c-a058-570e29e34338"
  principal_object_id = azuread_service_principal.graph_api.object_id
  resource_object_id  = data.azuread_service_principal.msgraph.object_id
}

resource "azuread_app_role_assignment" "graph_sites_read_all" {
  app_role_id         = "332a536c-c7ef-4017-ab91-336970924f0d"
  principal_object_id = azuread_service_principal.graph_api.object_id
  resource_object_id  = data.azuread_service_principal.msgraph.object_id
}

resource "azuread_app_role_assignment" "graph_user_read_all" {
  app_role_id         = "df021288-bdef-4463-88db-98f22de89214"
  principal_object_id = azuread_service_principal.graph_api.object_id
  resource_object_id  = data.azuread_service_principal.msgraph.object_id
}
