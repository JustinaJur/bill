const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");

module.exports = defineConfig({
  configureWebpack: {
    devtool: "source-map", // Enable source maps here
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      }),
    ],
  },
  publicPath:
    process.env.VUE_APP_ENV === "production" ? "/bill-i9nh.onrender.com/" : "/",
});
