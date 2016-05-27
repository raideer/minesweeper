class SpriteLoader{
    constructor(){
        this.sprites = [];
        this.loadedSprites = {};
    }

    add(name, src, size){
        var data = {src, size, name};
        this.sprites.push(data);
    }

    load(callback){
        var self = this;
        if(this.sprites.length > 0){
            var sprite = this.sprites.shift();
            var img = new Image(sprite.size, sprite.size);
            img.src = sprite.src;
            img.onload = function() {
                self.loadedSprites[sprite.name] = img;
                self.load(callback);
            }
        }else{
            if(typeof callback == "function"){
                callback(self.getLoaded());
            }
        }
    }

    getLoaded(){
        return this.loadedSprites;
    }
}
