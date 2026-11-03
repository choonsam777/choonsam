import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../', import.meta.url)
const repo = 'https://raw.githubusercontent.com/choonsam777/choonsam/main'
const githubRepo = 'choonsam777/choonsam'
const server = JSON.parse(await readFile(new URL('server.json', root), 'utf8'))
const modsDir = new URL('mods/', root)
const names = (await readdir(modsDir)).filter(name => name.toLowerCase().endsWith('.jar')).sort()
// Shaderpacks are resolved through their publisher's Modrinth listing. The
// Complementary license does not permit reuploading the ZIP to this repository.
const shaderpackRefs = JSON.parse(await readFile(new URL('shaderpacks.json', root), 'utf8'))
const seen = new Set()
const mods = []
const shaderpacks = []
function addMod(name, size, md5, url) {
  if (!/^[\w.+-]+\.jar$/i.test(name)) throw new Error(`모드 파일 이름에는 영문, 숫자, 점, 밑줄, 하이픈만 사용하세요: ${name}`)
  const slug = name.slice(0, -4).toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  if (seen.has(slug)) throw new Error(`모드 이름이 중복됩니다: ${name}`)
  seen.add(slug)
  mods.push({
    id: `choonsam.mods:${slug}:${md5.slice(0, 12)}`,
    name,
    type: 'FabricMod',
    required: { value: true },
    artifact: { size, MD5: md5, path: name, url }
  })
}
for (const name of names) {
  const bytes = await readFile(new URL(`mods/${name}`, root))
  const md5 = createHash('md5').update(bytes).digest('hex')
  addMod(name, bytes.length, md5, `${repo}/mods/${encodeURIComponent(name)}?v=${md5}`)
}
for (const ref of shaderpackRefs) {
  if (!/^[a-zA-Z0-9_-]+$/.test(ref.project) || !/^[a-zA-Z0-9._-]+$/.test(ref.version)) {
    throw new Error('쉐이더팩 project/version 형식이 잘못되었습니다.')
  }
  const versionResponse = await fetch(`https://api.modrinth.com/v2/project/${ref.project}/version/${ref.version}`, {
    headers: { 'User-Agent': 'ChunsamVillageLauncher/1.0 (choonsam777/choonsam)' }
  })
  if (!versionResponse.ok) throw new Error(`Modrinth 버전 조회 실패: ${ref.project}/${ref.version} (HTTP ${versionResponse.status})`)
  const version = await versionResponse.json()
  if (!version.game_versions.includes('26.3')) throw new Error(`Minecraft 26.3과 호환되지 않는 쉐이더팩: ${ref.project}/${ref.version}`)
  const file = version.files.find(file => file.primary) || version.files[0]
  if (!file) throw new Error(`다운로드 파일이 없는 쉐이더팩: ${ref.project}/${ref.version}`)
  const { filename: name, size, url, hashes } = file
  if (!/^[\w.+-]+\.zip$/i.test(name) || !url.startsWith('https://cdn.modrinth.com/')) {
    throw new Error(`쉐이더팩 파일 이름 또는 주소가 잘못되었습니다: ${name}`)
  }
  const download = await fetch(url, { headers: { 'User-Agent': 'ChunsamVillageLauncher/1.0 (choonsam777/choonsam)' } })
  if (!download.ok || !download.body) throw new Error(`쉐이더팩 검증 다운로드 실패: ${name} (HTTP ${download.status})`)
  const md5Hash = createHash('md5')
  const sha1Hash = createHash('sha1')
  let actualSize = 0
  for await (const chunk of download.body) {
    md5Hash.update(chunk)
    sha1Hash.update(chunk)
    actualSize += chunk.length
  }
  if (actualSize !== size || sha1Hash.digest('hex') !== hashes.sha1) throw new Error(`쉐이더팩 크기 또는 해시 불일치: ${name}`)
  const md5 = md5Hash.digest('hex')
  const slug = name.slice(0, -4).toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  shaderpacks.push({
    id: `choonsam.shaderpacks:${slug}:${md5.slice(0, 12)}`,
    name,
    type: 'File',
    artifact: {
      size,
      MD5: md5,
      path: `shaderpacks/${name}`,
      url
    }
  })
}

// GitHub's repository file limit is 100 MiB. Larger mods live in a dedicated release.
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ChunsamVillageLauncher',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
}
const releasesResponse = await fetch(`https://api.github.com/repos/${githubRepo}/releases?per_page=100`, { headers })
if (!releasesResponse.ok) throw new Error(`GitHub 릴리스 조회 실패: HTTP ${releasesResponse.status}`)
const releases = await releasesResponse.json()
const largeRelease = releases
  .filter(release => !release.draft && release.tag_name.startsWith('chunsam-mods-'))
  .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0]
if (largeRelease) {
  for (const asset of largeRelease.assets.filter(asset => asset.name.toLowerCase().endsWith('.jar')).sort((a, b) => a.name.localeCompare(b.name))) {
    const response = await fetch(asset.browser_download_url, { headers: { 'User-Agent': 'ChunsamVillageLauncher' } })
    if (!response.ok || !response.body) throw new Error(`큰 모드 다운로드 실패: ${asset.name} (HTTP ${response.status})`)
    const hash = createHash('md5')
    let size = 0
    for await (const chunk of response.body) {
      hash.update(chunk)
      size += chunk.length
    }
    if (size !== asset.size) throw new Error(`큰 모드 크기 불일치: ${asset.name}`)
    const md5 = hash.digest('hex')
    addMod(asset.name, size, md5, `${asset.browser_download_url}?v=${md5}`)
  }
}

const distribution = {
  version: '1.0.0',
  servers: [{
    id: 'ChunsamVillage-26.3',
    name: server.name,
    description: server.description,
    icon: `${repo}/icon.png`,
    version: '1.0.0',
    address: server.address,
    minecraftVersion: '26.3',
    mainServer: true,
    autoconnect: server.autoconnect,
    javaOptions: { supported: '>=25.x', suggestedMajor: 25, distribution: 'TEMURIN' },
    modules: [{
      id: 'net.fabricmc:fabric-loader:0.20.1',
      name: 'Fabric Loader 0.20.1',
      type: 'Fabric',
      artifact: {
        size: 1988880,
        MD5: '2e3dc8eebfde75fc8078c931090cd46f',
        url: 'https://maven.fabricmc.net/net/fabricmc/fabric-loader/0.20.1/fabric-loader-0.20.1.jar'
      },
      subModules: [{
        id: 'fabric-loader-0.20.1-26.3',
        name: 'Fabric 26.3 profile',
        type: 'VersionManifest',
        artifact: {
          size: 2778,
          MD5: '26a4f84daf580a7f84f20286a349c70c',
          url: `${repo}/fabric/fabric-loader-0.20.1-26.3.json`
        }
      }]
    }, ...mods, ...shaderpacks]
  }]
}
await writeFile(new URL('distribution.json', root), `${JSON.stringify(distribution, null, 2)}\n`)
console.log(`배포 목록 생성 완료: 모드 ${mods.length}개, 쉐이더팩 ${shaderpacks.length}개`)
