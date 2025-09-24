import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function runPowerShell(script: string, timeoutMs = 30 * 60 * 1000): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }>{
  return new Promise((resolve) => {
    const ps = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      windowsHide: true,
    })

    let stdout = ""
    let stderr = ""
    let finished = false

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true
        try {
          ps.kill("SIGTERM")
        } catch {}
        resolve({ code: null, stdout, stderr: stderr + "\nTimed out.", timedOut: true })
      }
    }, timeoutMs)

    ps.stdout.on("data", (d) => {
      stdout += d.toString()
    })
    ps.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    ps.on("close", (code) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      resolve({ code, stdout, stderr, timedOut: false })
    })
    ps.on("error", (err) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      stderr += ("\n" + (err?.message || String(err)))
      resolve({ code: null, stdout, stderr, timedOut: false })
    })
  })
}

export async function POST(_req: NextRequest) {
  if (process.platform !== "win32") {
    return NextResponse.json({ ok: false, error: "This endpoint can only run on Windows (win32)." }, { status: 400 })
  }

  // Allow overriding via environment variable; fallback to the user-provided path
  const xmlPath = process.env.PUSH_BUILD_XML || "C:\\Users\\Lenovo\\Downloads\\Build-Script.xml"

  // Powershell script: parse XML and run each batch sequentially
  const psScript = `
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'
  $xmlPath = '${xmlPath.replace(/'/g, "''")}'
  if (-not (Test-Path -LiteralPath $xmlPath)) {
    Write-Output "ERROR: XML file not found at $xmlPath"
    exit 2
  }
  [xml]$xml = Get-Content -LiteralPath $xmlPath
  if (-not $xml -or -not $xml.joblist -or -not $xml.joblist.job) {
    Write-Output "ERROR: No jobs found in $xmlPath"
    exit 3
  }
  $jobs = $xml.joblist.job
  $i = 0
  foreach ($job in $jobs) {
    $i++
    $name = $job.name
    $path = $job.path
    if (-not $name) { $name = "Job $i" }
    if (-not $path -or -not (Test-Path -LiteralPath $path)) {
      Write-Output "SKIP: $name - path not found: $path"
      continue
    }
    Write-Output ("START: {0} ({1})" -f $name, $path)
    try {
      $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $path -WorkingDirectory (Split-Path -Parent $path) -Wait -PassThru -WindowStyle Hidden
      $code = $proc.ExitCode
      if ($code -ne 0) {
        Write-Output ("ERROR: {0} exit code {1}" -f $name, $code)
      } else {
        Write-Output ("DONE: {0}" -f $name)
      }
    }
    catch {
      Write-Output ("ERROR: {0} - {1}" -f $name, $_.Exception.Message)
    }
  }
  Write-Output "ALL JOBS FINISHED"
  `

  const startedAt = new Date().toISOString()
  const result = await runPowerShell(psScript)
  const finishedAt = new Date().toISOString()

  const ok = result.code === 0 || (result.stdout.includes("ALL JOBS FINISHED") && !result.timedOut)

  return NextResponse.json({
    ok,
    startedAt,
    finishedAt,
    exitCode: result.code,
    timedOut: result.timedOut,
    output: result.stdout,
    error: result.stderr || undefined,
    xmlPath,
  }, { status: ok ? 200 : 500 })
}
