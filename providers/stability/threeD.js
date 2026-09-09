// ═══════════════════════════════════════════════════════════════════════════
//   STABILITY AI — 3D (Stable Fast 3D, Stable Point Aware 3D / SPAR3D)
//   Both return a binary glTF (.glb) asset from a single input image.
// ═══════════════════════════════════════════════════════════════════════════

const { requireConfigured, postForBinary } = require('./client');

async function stableFast3D(imageBuffer, opts = {}) {
    requireConfigured('Stable Fast 3D');
    return postForBinary('/v2beta/3d/stable-fast-3d', {
        image: imageBuffer,
        texture_resolution: opts.textureResolution || '1024',
        foreground_ratio: opts.foregroundRatio || '0.85',
        remesh: opts.remesh || 'none',
    }, 'model/gltf-binary');
}

// SPAR3D — improved backside/depth prediction, still in preview per Stability.
async function stablePointAware3D(imageBuffer, opts = {}) {
    requireConfigured('Stable Point Aware 3D');
    return postForBinary('/v2beta/3d/stable-point-aware-3d', {
        image: imageBuffer,
        texture_resolution: opts.textureResolution || '1024',
        foreground_ratio: opts.foregroundRatio || '1.3',
        remesh: opts.remesh || 'none',
    }, 'model/gltf-binary');
}

module.exports = { stableFast3D, stablePointAware3D };
