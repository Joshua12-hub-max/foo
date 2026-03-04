# Bulk fix: replace 0/1 with false/true for all boolean columns across controllers and scripts
# This handles eq() comparisons like eq(column, 1) -> eq(column, true)
# and assignment patterns like isActive: 1 -> isActive: true

$booleanColumns = @(
    'isVacant', 'is_vacant',
    'isActive', 'is_active', 
    'isCoterminous', 'is_coterminous',
    'isRead', 'is_read',
    'isSelfAssessment', 'is_self_assessment',
    'disagreed',
    'isPrimary', 'is_primary',
    'isCurrent', 'is_current',
    'isGovernment', 'is_government',
    'isPrivate', 'is_private',
    'isWithPay', 'is_with_pay',
    'withPay', 'with_pay',
    'acknowledgmentRequired', 'acknowledgment_required',
    'is_meycauayan_resident',
    'require_civil_service',
    'require_government_ids', 
    'require_education_experience'
)

$files = Get-ChildItem -Path "c:\Users\Joshua\project\nebr\backend\controllers","c:\Users\Joshua\project\nebr\backend\scripts","c:\Users\Joshua\project\nebr\backend\services" -Filter *.ts -Recurse

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    foreach ($col in $booleanColumns) {
        # Pattern: eq(table.column, 1) or eq(column, 1) -> eq(table.column, true)
        $content = $content -replace "(?<=eq\([^)]*\.$col,\s*)1(?=\s*\))", "true"
        $content = $content -replace "(?<=eq\([^)]*\.$col,\s*)0(?=\s*\))", "false"
        
        # Pattern: column: 1 -> column: true (assignment in objects)
        $content = $content -replace "(?<=$col\s*:\s*)1(?=\s*[,}\)])", "true"
        $content = $content -replace "(?<=$col\s*:\s*)0(?=\s*[,}\)])", "false"
        
        # Pattern: ? 1 : 0 after column name context (ternary)
        $content = $content -replace "(?<=$col\s*:\s*[^,]+\?\s*)1(?=\s*:\s*0)", "true"
        $content = $content -replace "(?<=$col\s*:\s*[^,]+\?\s*true\s*:\s*)0", "false"
    }
    
    if ($content -ne $original) {
        Set-Content $file.FullName -Value $content -NoNewline
        $totalReplacements++
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "`nTotal files fixed: $totalReplacements"
