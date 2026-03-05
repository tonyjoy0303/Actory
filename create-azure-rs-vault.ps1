# <#
# .SYNOPSIS
#   Creates a fully optimized multi-region Azure Recovery Services vault.
# .DESCRIPTION
#   This advanced function provisions a Recovery Services vault with geo-redundancy, soft delete, and cross-region restore enabled.
#   It supports multi-region deployment and applies recommended security and compliance settings.
# .EXAMPLE
#   New-MultiRegionRecoveryServicesVault -VaultName "SampleVault" -ResourceGroupName "SampleRG" -Locations @("eastus", "westus2")
# .NOTES
#   Update the sample variable values as needed.
#>
function New-MultiRegionRecoveryServicesVault {
	[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
	param(
		[Parameter(Mandatory)]
		[string]$VaultName = 'SampleVault',

		[Parameter(Mandatory)]
		[string]$ResourceGroupName = 'SampleResourceGroup',

		[Parameter(Mandatory)]
		[string[]]$Locations = @('eastus', 'westus2'),

		[Parameter()]
		[string]$Sku = 'Standard',

		[Parameter()]
		[switch]$EnableSoftDelete,

		[Parameter()]
		[switch]$EnableCrossRegionRestore
	)

	begin {
		Write-Verbose "Starting multi-region Recovery Services vault creation..."
		$ErrorActionPreference = 'Stop'
	}

	process {
		foreach ($Location in $Locations) {
			if ($PSCmdlet.ShouldProcess("$VaultName in $Location", 'Create Recovery Services vault')) {
				Write-Verbose "Creating Recovery Services vault '$VaultName' in region '$Location'..."
				$vault = New-AzRecoveryServicesVault -Name $VaultName -ResourceGroupName $ResourceGroupName -Location $Location -Sku $Sku

				# Enable geo-redundant storage
				Set-AzRecoveryServicesBackupProperty -VaultId $vault.ID -BackupStorageRedundancy GeoRedundant

				# Enable soft delete if requested
				if ($EnableSoftDelete.IsPresent) {
					Write-Verbose "Enabling soft delete for vault '$VaultName' in '$Location'..."
					Set-AzRecoveryServicesVaultProperty -VaultId $vault.ID -SoftDeleteFeatureState Enabled
				}

				# Enable cross-region restore if requested
				if ($EnableCrossRegionRestore.IsPresent) {
					Write-Verbose "Enabling cross-region restore for vault '$VaultName' in '$Location'..."
					Set-AzRecoveryServicesVaultProperty -VaultId $vault.ID -CrossRegionRestoreState Enabled
				}

				# Apply recommended security settings
				Write-Verbose "Applying recommended security settings..."
				Set-AzRecoveryServicesVaultProperty -VaultId $vault.ID -PublicNetworkAccessState Disabled
				Set-AzRecoveryServicesVaultProperty -VaultId $vault.ID -ImmutabilityState Enabled
			}
		}
	}

	end {
		Write-Verbose "Multi-region Recovery Services vault creation completed."
	}
}
