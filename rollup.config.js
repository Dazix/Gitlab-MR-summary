
import babel from 'rollup-plugin-babel';

export default {
    plugins: [
        babel({
            exclude: 'node_modules/**' // only transpile our source code
        })
    ]
};