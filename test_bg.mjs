import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
// Use dynamic import for videoGeneration
const mod = await import(pathToFileURL(path.resolve('src/lib/video/videoGeneration.ts')).href).catch(e=>{console.error('import failed',e); process.exit(1)})
// Actually use tsx? Simpler: just check file contains no boxblur
const t = fs.readFileSync('src/lib/video/videoGeneration.ts','utf8')
console.log('has boxblur?', t.includes('boxblur'))
console.log('has bg blur line?', t.includes('colorchannelmixer=rr=0.7'))
console.log('has new bg scale+crop?', t.includes('scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080'))
// Check overlay logic
console.log('has [bg][art]overlay?', t.includes('[bg][art]overlay'))
// Should be no [bg][art]overlay now for non-circular? It should still not have?
const bgChainIdx = t.indexOf('const bgChain')
console.log(t.slice(bgChainIdx, bgChainIdx+500))

// Now actually generate a 5s video to ensure no EINVAL
import { generateVideo } from './src/lib/video/videoGeneration.ts'
