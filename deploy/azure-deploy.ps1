# Azure deploy helper script (PowerShell)
# NOTE: This script contains placeholders. Do NOT run until you replace the placeholders with real values.
# Steps:
# 1) az login
# 2) set variables below
# 3) run the script to build, push image to ACR and deploy Bicep

param(
  [string]$subscriptionId = '',
  [string]$resourceGroupName = 'rg-spark-automate',
  [string]$location = 'eastus',
  [string]$acrName = '',
  [string]$imageTag = 'spark-automate-studio:local:v1',
  [string]$environmentName = 'dev'
)

if (-not $subscriptionId) {
  Write-Host "Please set subscriptionId parameter and re-run the script" -ForegroundColor Yellow
  exit 1
}

Write-Host "Login to Azure (interactive)"
Write-Host "Run: az login --use-device-code" -ForegroundColor Cyan

Write-Host "Setting subscription: $subscriptionId"
az account set --subscription $subscriptionId

# Create resource group
az group create --name $resourceGroupName --location $location | Out-Null

# Create ACR if not exists
if (-not $acrName) {
  $acrName = "${resourceGroupName}acr"
  Write-Host "No ACR name provided; using: $acrName"
}
az acr create --resource-group $resourceGroupName --name $acrName --sku Basic --location $location

# Build and push image
Write-Host "Building Docker image locally"
docker build -t $imageTag -f Dockerfile .

# Login to ACR and push
az acr login --name $acrName
$loginServer = az acr show --name $acrName --query loginServer -o tsv
$fullImage = "$loginServer/$imageTag"
docker tag $imageTag $fullImage
docker push $fullImage

# Deploy infra using Bicep
Write-Host "Deploying Bicep template..."
az deployment group create --resource-group $resourceGroupName --template-file infra/main.bicep --parameters infra/main.parameters.json --parameters environmentName=$environmentName location=$location

Write-Host "Deployment script finished. Check Azure Portal or use az containerapp list to inspect deployed container apps." -ForegroundColor Green

