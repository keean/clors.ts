import typescript from 'rollup-plugin-typescript2'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'

export default {
    entry: 'src/main.js',
    dest: 'public/zsc.min.js',
    sourceMap: true,
    treeshake: true,
    format: 'iife',
    plugins: [
        typescript(),
        nodeResolve({jsnext: true, module: true}),
        commonjs(),
        uglify()
    ],
    onwarn: function(message) {
        if (/The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten./.test(message)) {
            return
        }
        console.error(message)
    }
}

