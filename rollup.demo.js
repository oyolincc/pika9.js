import copy from 'rollup-plugin-copy'

export default [{
  input: './src/demo.js',
  output: {
    file: './dist-demo/demo.js',
    format: 'cjs',
    exports: 'none'
  },
  plugins: [
    copy({
      targets: [
        { src: 'public/**/*', dest: 'dist-demo' }
      ]
    })
  ]
}]
