# =============================================================================
# Networking Module — VPC (AWS) / VNet (Azure)
# =============================================================================
# HIPAA Compliance:
# - All database and compute resources in private subnets (no public IP)
# - NAT gateway for outbound-only internet from private subnets
# - Network security groups restrict ingress to required ports only
# - VPC Flow Logs / NSG Flow Logs enabled for audit trail
# =============================================================================

variable "cloud_provider" {
  type = string
}

variable "environment" {
  type = string
}

variable "project_name" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

locals {
  is_aws   = var.cloud_provider == "aws"
  is_azure = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# AWS: VPC + Subnets + NAT Gateway
# =============================================================================

data "aws_availability_zones" "available" {
  count = local.is_aws ? 1 : 0
  state = "available"
}

resource "aws_vpc" "main" {
  count = local.is_aws ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

# HIPAA: VPC Flow Logs for network audit trail
resource "aws_flow_log" "main" {
  count = local.is_aws ? 1 : 0

  vpc_id               = aws_vpc.main[0].id
  traffic_type         = "ALL"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn
  iam_role_arn         = aws_iam_role.flow_logs[0].arn
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = local.is_aws ? 1 : 0

  name              = "/aws/vpc/${local.name_prefix}/flow-logs"
  retention_in_days = 365 # HIPAA: retain network logs for compliance review
}

resource "aws_iam_role" "flow_logs" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-flow-logs-policy"
  role  = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

# Public subnets (ALB/NLB only — no compute or data resources)
resource "aws_subnet" "public" {
  count = local.is_aws ? var.az_count : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available[0].names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${count.index}"
    Tier = "public"
  }
}

# Private subnets (compute + database — HIPAA: no direct internet ingress)
resource "aws_subnet" "private" {
  count = local.is_aws ? var.az_count : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = data.aws_availability_zones.available[0].names[count.index]

  tags = {
    Name = "${local.name_prefix}-private-${count.index}"
    Tier = "private"
  }
}

resource "aws_internet_gateway" "main" {
  count  = local.is_aws ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_eip" "nat" {
  count  = local.is_aws ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  count = local.is_aws ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${local.name_prefix}-nat"
  }
}

resource "aws_route_table" "public" {
  count  = local.is_aws ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = local.is_aws ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name = "${local.name_prefix}-private-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = local.is_aws ? var.az_count : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count          = local.is_aws ? var.az_count : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

# Security Groups

resource "aws_security_group" "compute" {
  count  = local.is_aws ? 1 : 0
  name   = "${local.name_prefix}-compute-sg"
  vpc_id = aws_vpc.main[0].id

  # Inbound: ALB only
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Platform API from ALB"
  }

  # Outbound: allow all (NAT gateway handles routing)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-compute-sg"
  }
}

resource "aws_security_group" "database" {
  count  = local.is_aws ? 1 : 0
  name   = "${local.name_prefix}-db-sg"
  vpc_id = aws_vpc.main[0].id

  # HIPAA: Database only accessible from compute security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.compute[0].id]
    description     = "PostgreSQL from compute only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-db-sg"
  }
}

# =============================================================================
# Azure: VNet + Subnets + NSGs
# =============================================================================

resource "azurerm_resource_group" "main" {
  count    = local.is_azure ? 1 : 0
  name     = "${local.name_prefix}-rg"
  location = var.region
}

resource "azurerm_virtual_network" "main" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-vnet"
  resource_group_name = azurerm_resource_group.main[0].name
  location            = azurerm_resource_group.main[0].location
  address_space       = [var.vpc_cidr]
}

resource "azurerm_subnet" "public" {
  count                = local.is_azure ? 1 : 0
  name                 = "${local.name_prefix}-public"
  resource_group_name  = azurerm_resource_group.main[0].name
  virtual_network_name = azurerm_virtual_network.main[0].name
  address_prefixes     = [cidrsubnet(var.vpc_cidr, 8, 0)]
}

resource "azurerm_subnet" "private" {
  count                = local.is_azure ? 1 : 0
  name                 = "${local.name_prefix}-private"
  resource_group_name  = azurerm_resource_group.main[0].name
  virtual_network_name = azurerm_virtual_network.main[0].name
  address_prefixes     = [cidrsubnet(var.vpc_cidr, 8, 100)]

  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action"
      ]
    }
  }
}

resource "azurerm_subnet" "aks" {
  count                = local.is_azure ? 1 : 0
  name                 = "${local.name_prefix}-aks"
  resource_group_name  = azurerm_resource_group.main[0].name
  virtual_network_name = azurerm_virtual_network.main[0].name
  address_prefixes     = [cidrsubnet(var.vpc_cidr, 8, 10)]
}

# HIPAA: NSG restricts database access to compute subnet only
resource "azurerm_network_security_group" "database" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-db-nsg"
  resource_group_name = azurerm_resource_group.main[0].name
  location            = azurerm_resource_group.main[0].location

  security_rule {
    name                       = "allow-postgres-from-aks"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = cidrsubnet(var.vpc_cidr, 8, 10)
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "compute" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-compute-nsg"
  resource_group_name = azurerm_resource_group.main[0].name
  location            = azurerm_resource_group.main[0].location

  security_rule {
    name                       = "allow-https-inbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# HIPAA: NSG Flow Logs for Azure network audit trail
resource "azurerm_network_watcher_flow_log" "database" {
  count = local.is_azure ? 1 : 0

  network_watcher_name = "NetworkWatcher_${var.region}"
  resource_group_name  = "NetworkWatcherRG"
  name                 = "${local.name_prefix}-db-flow-log"

  network_security_group_id = azurerm_network_security_group.database[0].id
  storage_account_id        = azurerm_storage_account.flow_logs[0].id
  enabled                   = true

  retention_policy {
    enabled = true
    days    = 365
  }
}

resource "azurerm_storage_account" "flow_logs" {
  count                    = local.is_azure ? 1 : 0
  name                     = replace("${var.project_name}${var.environment}flow", "-", "")
  resource_group_name      = azurerm_resource_group.main[0].name
  location                 = azurerm_resource_group.main[0].location
  account_tier             = "Standard"
  account_replication_type = "GRS" # HIPAA: geo-redundant for compliance data
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID (AWS) or VNet ID (Azure)"
  value       = local.is_aws ? aws_vpc.main[0].id : (local.is_azure ? azurerm_virtual_network.main[0].id : "")
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = local.is_aws ? aws_subnet.public[*].id : (
    local.is_azure ? [azurerm_subnet.public[0].id] : []
  )
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value = local.is_aws ? aws_subnet.private[*].id : (
    local.is_azure ? [azurerm_subnet.private[0].id] : []
  )
}

output "db_security_group_id" {
  description = "Security group/NSG ID for database access"
  value = local.is_aws ? aws_security_group.database[0].id : (
    local.is_azure ? azurerm_network_security_group.database[0].id : ""
  )
}

output "compute_security_group_id" {
  description = "Security group/NSG ID for compute resources"
  value = local.is_aws ? aws_security_group.compute[0].id : (
    local.is_azure ? azurerm_network_security_group.compute[0].id : ""
  )
}

output "resource_group_name" {
  description = "Azure resource group name (empty string for AWS)"
  value       = local.is_azure ? azurerm_resource_group.main[0].name : ""
}
