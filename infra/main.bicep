@description('Environment name (e.g. dev, staging, prod)')
param environmentName string = 'dev'
@description('Location for resources')
param location string = resourceGroup().location

// Resource name token per rules
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)

// Naming rules: az{prefix}{resourceToken}
var acrName = 'azacr${resourceToken}'
var saName = toLower('azst${resourceToken}')
var kvName = 'azkv${resourceToken}'
var uamiName = 'azuam${resourceToken}'
var containerAppEnvName = 'azcaenv${resourceToken}'
var containerAppName = 'azca${resourceToken}'

// User-assigned managed identity
resource userIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: uamiName
  location: location
}

// Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2022-02-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// Storage Account (secure defaults)
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: saName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    allowSharedKeyAccess: false
  }
}

// Key Vault (only included; secrets usage is optional)
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = if (true) {
  name: kvName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enablePurgeProtection: false
    publicNetworkAccess: 'Enabled' // per rule
    networkAcls: {
      defaultAction: 'Allow'
    }
    accessPolicies: []
  }
}

// Role assignment: assign AcrPull to the user-assigned identity for the registry
// Role definition id for AcrPull: 7f951dda-4ed3-4680-a7ca-43fe172d538d
resource acrRoleAssignment 'Microsoft.Authorization/roleAssignments@2020-10-01-preview' = {
  name: guid(acr.id, userIdentity.id, 'acrPull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions','7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: userIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
  dependsOn: [acr, userIdentity]
}

// Log Analytics workspace for Container Apps Environment - create with deterministic name
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2020-08-01' = {
  name: 'azlaw${resourceToken}'
  location: location
  sku: {
    name: 'PerGB2018'
  }
  properties: {}
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.Web/kubeEnvironments@2022-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    kubeEnvironmentProfile: {
      location: location
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
      }
    }
  }
  dependsOn: [logAnalytics]
}

// Container App using mandated base image per rules
resource containerApp 'Microsoft.Web/containerApps@2022-03-01' = {
  name: containerAppName
  location: location
  properties: {
    kubeEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        traffic: [
          {
            label: 'production'
            weight: 100
          }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
          allowCredentials: false
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: ''
          password: ''
        }
      ]
      secrets: []
    }
    template: {
      containers: [
        {
          name: 'app'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // mandated
          probes: []
          resources: {
            cpu: 0.5
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userIdentity.id}': {}
    }
  }
  dependsOn: [containerAppEnv, acrRoleAssignment]
}

output acrLoginServer string = acr.properties.loginServer
output containerAppName string = containerApp.name

