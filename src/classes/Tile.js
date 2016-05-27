class Tile{
    constructor(size, x, y){
        this.size = size;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.isMine = false;
        this.isFlag = false;
        this.isHovered = false;
        this.adjacentMines = 0;
        this.exploded = false;
    }

    getSprite(){
        if(this.isMine && this.isOpen){
            return 'mine';
        }else if(this.isFlag && !this.isOpen){
            return 'flag';
        }else if(this.isOpen && !this.isMine){
            return 'open';
        }else{
            return 'tile';
        }
    }

    getCoords(){
        var x = this.x;
        var y = this.y;
        return {x, y};
    }

    getPosition(){
        var x = this.x * this.size;
        var y = this.y * this.size;

        return {x, y};
    }

    getCenterPosition(){
        var pos = this.getPosition();
        pos.x += Math.floor(this.size/2);
        pos.y += Math.floor(this.size/2);

        return pos;
    }
}
