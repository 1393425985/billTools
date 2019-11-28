
import * as config from '@utils/config'
export default class ImageControl{
    static getAvatar(id:string){
        return `${config.host}/avatar/${id}.webp`;
    }
}