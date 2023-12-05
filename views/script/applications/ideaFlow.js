const board = document.querySelector('svg');
const blocksGroup = board.querySelector('g#blocks');
const linksGroup = blocksGroup.querySelector('g#links');

const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_CURVE_CONTROL = 200;

class MindMapBoard {
    constructor(svg, blocksGroup, linksGroup, gridSize = 28) {
        this.blocks = {};
        this.registry = new Map();
        this.svg = svg;
        this.blocksGroup = blocksGroup;
        this.linksGroup = linksGroup;
        this.gridSize = gridSize;

        this.movingBlock = null;
        this.originOnBlock = { x: 0, y: 0 };

        this.resizing = null;

        this.zoom = 1;
        this.blocksGroupDrag = { x: -25000, y: -25000 };

        this.dragging = false;

        this.connectingBlockId = null;
        this.connectingWhich = null;

        this.links = [];

        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        svg.addEventListener('mousedown', this.onMouseDown.bind(this))
        svg.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.updateBoardTransform();
    }

    mousePosOnBoard(e) {
        const rect = this.svg.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;

        return { x, y, width, height };
    }

    static createBlock(title, description) {
        const template = document.querySelector('.MindMapBlockTemplate');

        const clone = template.content.firstElementChild.cloneNode(true);
        clone.querySelector('.MindMapBlockTitle').innerText = title;
        clone.querySelector('.MindMapBlockDescription').innerText = description;

        const foreignObj = document.createElementNS(SVG_NS, 'foreignObject');
        foreignObj.setAttribute('overflow', 'visible');
        foreignObj.setAttribute('width', 1);
        foreignObj.setAttribute('height', 1)

        foreignObj.appendChild(clone);

        return foreignObj;
    }

    static axisFromSide(side) {
        if(side === 'top' || side === 'bottom') return 'vertical';
        
        return 'horizontal';
    }

    onMouseDown() {
        this.dragging = true;
    }

    onMouseUp() {
        this.dragging = false;
        this.movingBlock = null;
        this.resizing = null;

        this.connectingBlockId = null;
        this.connectingWhich = null;
    }

    onMouseMove(e) {
        if(this.resizing) {
            const dataBlock = this.blocks[this.resizing];
            if(!dataBlock) return;

            const domBlock = this.registry.get(this.resizing);
            
            const additionalX = dataBlock.additionalGridUnitsX;
            const trueWidth = domBlock.firstChild.clientWidth - additionalX * this.gridSize;

            const neededX = Math.max(Math.round((this.mousePosOnBoard(e).x - this.blocksGroupDrag.x - dataBlock.x - trueWidth) / this.gridSize), 0);
            if(neededX === dataBlock.additionalGridUnitsX) return;

            dataBlock.additionalGridUnitsX = neededX;
            this.resizeBlock(this.resizing);

            return;
        }

        if(this.dragging) {
            this.blocksGroupDrag.x += e.movementX;
            this.blocksGroupDrag.y += e.movementY;

            return this.updateBoardTransform();
        }
        
        if(this.movingBlock) {
            const { x, y } = this.mousePosOnBoard(e);

            const newX = Math.ceil((x - this.blocksGroupDrag.x - this.originOnBlock.x) / this.gridSize) * this.gridSize;
            const newY = Math.ceil((y - this.blocksGroupDrag.y - this.originOnBlock.y) / this.gridSize) * this.gridSize;

            return this.updateBlockPos(this.movingBlock, newX, newY);
        }
    }

    onBlockMouseDown(e, id) {
        const { x, y } = this.mousePosOnBoard(e);

        this.movingBlock = id;
        this.originOnBlock = { x: x - this.blocks[id].x - this.blocksGroupDrag.x, y: y - this.blocks[id].y - this.blocksGroupDrag.y };
    }

    updateBoardTransform() {
        this.blocksGroup.style.transform = `translate(${this.blocksGroupDrag.x}px, ${this.blocksGroupDrag.y}px) scale(${this.zoom})`;
    }

    updateBlockPos(id, x, y) {
        if(this.blocks[id].x === x && this.blocks[id].y === y) return;
        this.blocks[id].x = x;
        this.blocks[id].y = y;

        const block = this.registry.get(id);
        block.setAttribute('x', x);
        block.setAttribute('y', y);

        this.updateBlockLinks(id);        
    }

    updateBlockLinks(id) {
        for(let link in this.links) {
            if(this.links[link][0] === id || this.links[link][2] === id) this.renderLink(link);
        }
    }

    createAndInsertBlock(id, title, description, x, y) {
        this.blocks[id] = { title, description, x, y, additionalGridUnitsX: 0 };

        const elem = this.constructor.createBlock(title, description);
        elem.dataset.id = id;
        elem.onmousedown = e => e.stopPropagation();
        elem.setAttribute('x', x);
        elem.setAttribute('y', y);
        
        this.blocksGroup.appendChild(elem);
        this.registry.set(id, elem);
        
        this.resizeBlock(id);

        elem.firstChild.addEventListener('mousedown', e => this.onBlockMouseDown(e, id));

        const connectors = elem.getElementsByClassName('connector');
        for(let connector of connectors) {
            const which = connector.classList[1];

            connector.addEventListener('mousedown', e => {
                e.stopPropagation();

                const receiving = this.constructor.axisFromSide(which);

                elem.firstChild.classList.add('connectingBlock');
                connector.classList.add('connecting');
                this.blocksGroup.classList.add('receiving', receiving);

                this.connectingBlockId = id;
                this.connectingWhich = which;

                window.addEventListener('mouseup', () => {
                    elem.firstChild.classList.remove('connectingBlock');
                    connector.classList.remove('connecting');
                    this.blocksGroup.classList.remove('receiving', receiving);

                    this.connectingBlockId = null;
                    this.connectingWhich = null;
                }, { once: true });
            });

            connector.addEventListener('mouseup', () => {
                this.connectorMouseUp(id, which);
            });
        }

        const resizer = elem.querySelector('.resizer');
        resizer.addEventListener('mousedown', e => {
            e.stopPropagation();
            
            this.resizing = id;
        });

        return elem;
    }

    connectorMouseUp(id, which) {
        if(!this.connectingBlockId) return;

        this.connect(this.connectingBlockId, this.connectingWhich, id, which);
    }

    connect(from, fromWhich, to, toWhich) {
        const link = this.getLink(from, fromWhich, to, toWhich);
        if(link || from === to) return;

        this.links.push([from, fromWhich, to, toWhich]);
        this.renderLink(-1);
        return true;
    }

    disconnect(from, fromWhich, to, toWhich) {
        const link = this.getLink(from, fromWhich, to, toWhich);
        if(!link) return;

        const index = this.links.indexOf(link);
        this.links.splice(index, 1);

        const domLink = this.getDomLink(from, fromWhich, to, toWhich);
        domLink?.remove();
    }

    getLink(from, fromWhich, to, toWhich) {
        const link = this.links.find(link => link[0] === from && link[1] === fromWhich && link[2] === to && link[3] === toWhich);
        
        return link;
    }

    getDomLink(from, fromWhich, to, toWhich) {
        const domLink = this.linksGroup.querySelector(`g[data-from="${from}"][data-from-which="${fromWhich}"][data-to="${to}"][data-to-which="${toWhich}"]`);

        return domLink;
    }

    renderLinkFromTo(from, fromWhich, to, toWhich) {
        const link = this.getLink(from, fromWhich, to, toWhich);
        if(!link) return false;

        const index = this.links.indexOf(link);
        return this.renderLink(index);
    }

    renderLink(index) {
        const link = this.links.at(index);
        if(!link) return false;

        let domLink = this.getDomLink(...link);
        if(!domLink) {
            const group = document.createElementNS(SVG_NS, 'g');
            group.classList.add('MindMapLink');

            const linkPath = document.createElementNS(SVG_NS, 'path');
            linkPath.classList.add('MindMapLinkPath');
            const linkHitbox = document.createElementNS(SVG_NS, 'path');
            linkHitbox.classList.add('MindMapLinkPathHitbox');

            linkPath.setAttribute('marker-end', 'url(#arrow)');

            group.dataset.from = link[0];
            group.dataset.fromWhich = link[1];
            group.dataset.to = link[2];
            group.dataset.toWhich = link[3];
            group.append(linkPath, linkHitbox);
            
            this.linksGroup.appendChild(group);
            domLink = group;

            domLink.addEventListener('click', () => this.disconnect(...link));
        }

        const fromBlock = this.registry.get(link[0]).firstChild;
        const toBlock = this.registry.get(link[2]).firstChild;

        const fromCenterX = this.blocks[link[0]].x + fromBlock.clientWidth / 2;
        const fromCenterY = this.blocks[link[0]].y + fromBlock.clientHeight / 2;
        const toCenterX = this.blocks[link[2]].x + toBlock.clientWidth / 2;
        const toCenterY = this.blocks[link[2]].y + toBlock.clientHeight / 2;

        let d = '';

        const axis = this.constructor.axisFromSide(link[1]);
        if(axis === 'horizontal') {
            const fromX = link[1] === 'left' ? this.blocks[link[0]].x : this.blocks[link[0]].x + fromBlock.clientWidth;
            const toX = link[3] === 'left' ? this.blocks[link[2]].x : this.blocks[link[2]].x + toBlock.clientWidth;
            const fromControlDir = link[1] === 'left' ? -1 : 1;
            const toControlDir = link[3] === 'right' ? -1 : 1;

            const xDiff = Math.abs(toX - fromX) / 2;
            d = `M${fromX} ${fromCenterY} C ${fromX + Math.max(xDiff, MIN_CURVE_CONTROL) * fromControlDir} ${fromCenterY}, ${toX - Math.max(xDiff, MIN_CURVE_CONTROL) * toControlDir} ${toCenterY}, ${toX} ${toCenterY}`;
        } else {
            const fromY = link[1] === 'top' ? this.blocks[link[0]].y : this.blocks[link[0]].y + fromBlock.clientHeight;
            const toY = link[3] === 'top' ? this.blocks[link[2]].y : this.blocks[link[2]].y + toBlock.clientHeight;
            const fromControlDir = link[1] === 'top' ? -1 : 1;
            const toControlDir = link[3] === 'bottom' ? -1 : 1;

            const yDiff = Math.abs(toY - fromY) / 2;
            d = `M${fromCenterX} ${fromY} C ${fromCenterX} ${fromY + Math.max(yDiff, MIN_CURVE_CONTROL) * fromControlDir}, ${toCenterX} ${toY - Math.max(yDiff, MIN_CURVE_CONTROL) * toControlDir}, ${toCenterX} ${toY}`;
        }

        domLink.querySelector('.MindMapLinkPath').setAttribute('d', d);
        domLink.querySelector('.MindMapLinkPathHitbox').setAttribute('d', d);
    }

    resizeBlock(id) {
        const block = this.registry.get(id)?.firstChild;
        if(!block) return null;

        block.style.setProperty('width', 'max-content');
        block.style.setProperty('height', 'max-content');

        const newWidth = (Math.ceil(block.clientWidth / this.gridSize) + this.blocks[id].additionalGridUnitsX) * this.gridSize;
        const newHeight = Math.ceil(block.clientHeight / this.gridSize) * this.gridSize;

        block.style.setProperty('width', `${newWidth}px`);
        block.style.setProperty('height', `${newHeight}px`);

        this.updateBlockLinks(id);
    
        return block;
    }
}

// TEST

const mindMap = new MindMapBoard(board, blocksGroup, linksGroup);

mindMap.createAndInsertBlock('test', 'test 1 qsdqsdq sqd', 'test 2', 25312, 25508)
mindMap.createAndInsertBlock('tdsfsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508)
mindMap.createAndInsertBlock('tdsqsdqsdt', 'test 1 qsdqsdq sqd', 'test 2q sdqsdqsd qsdqsdq sd qsd qsd', 25396, 25508)
mindMap.createAndInsertBlock('tdssdqsfsfsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508)
mindMap.createAndInsertBlock('tddfdgfdsfsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508)
mindMap.createAndInsertBlock('tdsfgdfgsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508)

mindMap.createAndInsertBlock('tests', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25312)
mindMap.createAndInsertBlock('t', '1', '2', 25900, 25704)