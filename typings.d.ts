declare module '*.css';
declare module "*.png";
declare module "*.less";
declare module "*.json";

declare module "file-loader?name=[name].js!*" {
    const value: string;
    export = value;
}

declare module "worker-loader*" {
    class WebpackWorker extends Worker {
        constructor();
    }

    export = WebpackWorker;
}