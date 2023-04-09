module.exports = {
    plugins: [
        'postcss-normalize',
        ['postcss-custom-media', {
            importFrom: {
                customMedia: {
                    '--sm': '(min-width: 544px)',
                    '--md': '(min-width: 768px)',
                    '--lg': '(min-width: 992px)',
                    '--xl': '(min-width: 1200px)',
                    '--retina': '(min-resolution: 144dpi), (min-resolution: 1.5dppx)',
                },
            },
        }],
        'autoprefixer',
        'postcss-sort-media-queries',
        'postcss-normalize-charset',
    ],
};
