$ProgressPreference = 'SilentlyContinue'
$base = 'https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2'
$outDir = 'C:\Users\augus\OneDrive\Documentos\PoliticDash\data\raw'
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function Download-Cep {
    param([string]$name, [string[]]$paths)
    $destName = 'sipa_' + $name + '_clae2.csv'
    $dest = Join-Path $outDir $destName
    foreach ($p in $paths) {
        $url = $base + '/' + $p
        Write-Host ('[' + $name + '] trying ' + $url)
        try {
            Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 120 -UseBasicParsing -ErrorAction Stop
            $size = (Get-Item $dest).Length
            if ($size -lt 1000) {
                Write-Host ('  tiny ' + $size + ' b — discard')
                Remove-Item $dest
                continue
            }
            Write-Host ('  OK ' + $size + ' bytes')
            return $true
        } catch {
            $msg = $_.Exception.Message
            Write-Host ('  FAIL: ' + $msg)
        }
    }
    Write-Host ('[' + $name + '] ALL ATTEMPTS FAILED')
    return $false
}

Download-Cep 'priv'       @('puestos/puestos_priv.csv') | Out-Null
Download-Cep 'todos'      @('puestos/puestos_todos.csv') | Out-Null
Download-Cep 'pub'        @('puestos/puestos_pub.csv','puestos/puestos_publ.csv','puestos/puestos_publico.csv') | Out-Null
Download-Cep 'monotributo' @('monotributo/monotributo.csv','puestos/monotributo.csv','monotributistas/monotributistas.csv','monotributistas/monotributo.csv') | Out-Null
Download-Cep 'autonomos'  @('autonomos/autonomos.csv','puestos/autonomos.csv') | Out-Null
Download-Cep 'casas'      @('casas_particulares/casas_particulares.csv','puestos/casas_particulares.csv','casas-particulares/casas_particulares.csv') | Out-Null

Write-Host ''
Write-Host '---- results ----'
Get-ChildItem $outDir -Filter 'sipa_*_clae2.csv' | ForEach-Object { Write-Host ($_.Name + '  ' + $_.Length + ' bytes') }
