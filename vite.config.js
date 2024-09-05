export default {
    main: '/path/to/main.js', // The path should be relative to the project root
    build: {
        minify: true,
        manifest: true,
        rollupOptions: {
            input: '/main.js',
            output: {
                format: 'umd',
                entryFileNames: 'index.js',
                esModule: false,
                compact: true,
            },
        },
    },
}