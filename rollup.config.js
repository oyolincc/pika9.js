import { terser } from 'rollup-plugin-terser'
import demoConfig from './rollup.demo'

const config = process.env.TARGET === 'demo' ? demoConfig : [{
  input: './src/index.js',
  output: {
    file: './dist/coverable.esm.js',
    format: 'esm',
    exports: 'default'
  },
  plugins: [
    terser()
  ]
}]

export default config
