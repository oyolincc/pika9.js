// import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'

export default [{
  input: './src/index.js',
  output: {
    file: './dist/coverable.js',
    format: 'cjs'
  },
  plugins: [
    copy({
      targets: [
        { src: 'public/**/*', dest: 'dist' }
      ]
    })
  ]
}]
