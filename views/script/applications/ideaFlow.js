const board = document.querySelector('svg');
const blocksGroup = board.querySelector('g#blocks');
const linksGroup = blocksGroup.querySelector('g#links');

const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_CURVE_CONTROL = 200;

let modifyingBlock = null;

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
        this.lastTouch = { x: 0, y: 0 };
        this.addBlockCoords = { x: 0, y: 0 };

        this.resizing = null;

        this.zoom = 1;
        this.blocksGroupDrag = { x: -25000, y: -25000 };

        this.dragging = false;

        this.connectingBlockId = null;
        this.connectingWhich = null;

        this.links = [];

        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        svg.addEventListener('mousedown', this.onMouseDown.bind(this));
        svg.addEventListener('mousemove', this.onMouseMove.bind(this));
        svg.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        svg.addEventListener('contextmenu', this.onContextMenu.bind(this));
        svg.addEventListener('click', this.onClick.bind(this));

        svg.addEventListener('touchstart', this.onTouchStart.bind(this));
        svg.addEventListener('touchmove', this.onTouchMove.bind(this));
        svg.addEventListener('touchend', this.onTouchEnd.bind(this));
        svg.addEventListener('touchcancel', this.onTouchEnd.bind(this));

        this.updateBoardTransform();
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.dragging = true;

            this.lastTouch.x = e.touches[0].clientX;
            this.lastTouch.y = e.touches[0].clientY;
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            const movementX = touchX - this.lastTouch.x;
            const movementY = touchY - this.lastTouch.y;

            this.lastTouch = { x: touchX, y: touchY };

            if (this.dragging) {
                this.blocksGroupDrag.x += movementX;
                this.blocksGroupDrag.y += movementY;
                this.updateBoardTransform();
            }
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            this.dragging = false;
            this.movingBlock = null;
            this.resizing = null;
            this.connectingBlockId = null;
            this.connectingWhich = null;
            this.lastTouch = { x: 0, y: 0 };
        }
    }

    onClick(e) {
        const menu = document.querySelector('.MindMapContextMenu');
        menu.style.display = 'none';
    }

    onContextMenu(e) {
        e.preventDefault();

        const { x, y } = this.mousePosOnRect(e);

        const menu = document.querySelector('.MindMapContextMenu');
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        const menuItems = menu.querySelectorAll('.MindMapContextMenuItem');
        for (let menuItem of menuItems) {
            menuItem.onclick = () => {
                menu.style.display = 'none';

                switch (menuItem.dataset.action) {
                    case 'add':
                        this.addBlockCoords = { x, y };
                        clearBlockCreation();
                        navbar('block');
                        /* this.createAndInsertBlock(crypto.randomUUID(), 'Nouveau bloc', '', x, y); */
                        break;
                }
            };
        }
    }

    onWheel(e) {
        e.preventDefault();

        const { x: xZoom, y: yZoom } = this.mousePosOnBoard(e);
        const x = xZoom * this.zoom;
        const y = yZoom * this.zoom;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        if (this.zoom * delta < 0.4 || this.zoom * delta > 1.5) return;
        this.zoom *= delta;

        this.blocksGroupDrag.x = x - (x - this.blocksGroupDrag.x) * delta;
        this.blocksGroupDrag.y = y - (y - this.blocksGroupDrag.y) * delta;

        this.updateBoardTransform();
    }

    mousePosOnRect(e) {
        const rect = document.querySelector('rect').getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        return { x: x / this.zoom, y: y / this.zoom };
    }

    mousePosOnBoard(e) {
        const rect = this.svg.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;

        return { x: x / this.zoom, y: y / this.zoom, width, height };
    }

    static createBlock(id, title, description, color = 'white', file = null) {
        const template = document.querySelector('.MindMapBlockTemplate');

        const clone = template.content.firstElementChild.cloneNode(true);
        clone.querySelector('.MindMapBlockTitle').innerText = title;
        clone.querySelector('.MindMapBlockDescription').innerHTML = description;
        clone.classList.add(color);

        clone.addEventListener('dblclick', () => {
            navbar('block');
            clearBlockCreation();
            modifyingBlock = id;
            document.getElementById('blockTitle').value = title;
            document.getElementById('blockDescription').innerHTML = description;
            document.querySelector('.colorSelector > #' + color).click();
            file ? document.querySelector('.drop-box').classList.add('ready-to-send') : document.querySelector('.drop-box').classList.remove('ready-to-send');
            selectedFile = file ? [file] : null;
        });

        if (!title) clone.querySelector('.MindMapBlockTitle').remove();
        if (!description) clone.querySelector('.MindMapBlockDescription').remove();

        if (file) {
            const img = document.createElement('img');
            img.src = `/preview?id=${file}`;
            img.alt = file;
            img.classList.add('blockImage');
            /* img.ondblclick = () => {
                window.open(`/viewer/${file}`);
            }; */
            clone.prepend(img);
        }

        const foreignObj = document.createElementNS(SVG_NS, 'foreignObject');
        foreignObj.setAttribute('overflow', 'visible');
        foreignObj.setAttribute('width', 1);
        foreignObj.setAttribute('height', 1);
        foreignObj.appendChild(clone);

        return foreignObj;
    }

    static axisFromSide(side) {
        if (side === 'top' || side === 'bottom') return 'vertical';

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
        if (this.resizing) {
            const dataBlock = this.blocks[this.resizing];
            if (!dataBlock) return;

            const domBlock = this.registry.get(this.resizing);

            const additionalX = dataBlock.additionalGridUnitsX;
            const trueWidth = domBlock.firstChild.clientWidth - additionalX * this.gridSize;

            const neededX = Math.max(Math.round((this.mousePosOnBoard(e).x - this.blocksGroupDrag.x / this.zoom - dataBlock.x - trueWidth) / this.gridSize), 0);
            if (neededX === additionalX) return;

            dataBlock.additionalGridUnitsX = neededX;

            return this.resizeBlock(this.resizing);
        }

        if (this.dragging) {
            this.blocksGroupDrag.x += e.movementX;
            this.blocksGroupDrag.y += e.movementY;

            return this.updateBoardTransform();
        }

        if (this.movingBlock) {
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
        if (this.blocks[id].x === x && this.blocks[id].y === y) return;
        this.blocks[id].x = x;
        this.blocks[id].y = y;

        const block = this.registry.get(id);
        block.setAttribute('x', x);
        block.setAttribute('y', y);

        this.updateBlockLinks(id);
    }

    updateBlockLinks(id) {
        for (let link in this.links) {
            if (this.links[link][0] === id || this.links[link][2] === id) this.renderLink(link);
        }
    }

    createAndInsertBlock(id, title, description, x, y, color, file = null, additionalGridUnitsX = 0) {
        this.blocks[id] = { id, title, description, x, y, color, file, additionalGridUnitsX };

        const elem = this.constructor.createBlock(id, title, description, color, file);
        elem.onmousedown = e => e.stopPropagation();
        elem.setAttribute('x', x);
        elem.setAttribute('y', y);

        this.blocksGroup.appendChild(elem);
        this.registry.set(id, elem);

        this.resizeBlock(id);

        elem.firstChild.addEventListener('mousedown', e => this.onBlockMouseDown(e, id));

        const connectors = elem.getElementsByClassName('connector');
        for (let connector of connectors) {
            const which = connector.classList[1];

            connector.addEventListener('mousedown', e => {
                e.stopPropagation();

                const receiving = this.constructor.axisFromSide(which);

                elem.firstChild.classList.add('connectingBlock');
                connector.classList.add('connecting');
                this.blocksGroup.classList.add('receiving', receiving);

                this.connectingBlockId = id;
                this.connectingWhich = which;

                window.addEventListener(
                    'mouseup',
                    () => {
                        elem.firstChild.classList.remove('connectingBlock');
                        connector.classList.remove('connecting');
                        this.blocksGroup.classList.remove('receiving', receiving);

                        this.connectingBlockId = null;
                        this.connectingWhich = null;
                    },
                    { once: true }
                );
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
        if (!this.connectingBlockId) return;

        this.connect(this.connectingBlockId, this.connectingWhich, id, which);
    }

    connect(from, fromWhich, to, toWhich) {
        const link = this.getLink(from, fromWhich, to, toWhich);
        if (link || from === to) return false;

        this.links.push([from, fromWhich, to, toWhich]);
        this.renderLink(-1);

        return true;
    }

    disconnect(from, fromWhich, to, toWhich) {
        const link = this.getLink(from, fromWhich, to, toWhich);
        if (!link) return;

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
        if (!link) return false;

        const index = this.links.indexOf(link);
        return this.renderLink(index);
    }

    renderLink(index) {
        const link = this.links.at(index);
        if (!link) return false;

        let domLink = this.getDomLink(...link);
        if (!domLink) {
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
        if (axis === 'horizontal') {
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
        if (!block) return null;

        block.style.setProperty('width', 'max-content');
        block.style.setProperty('height', 'max-content');

        const newWidth = (Math.ceil(block.clientWidth / this.gridSize) + this.blocks[id].additionalGridUnitsX) * this.gridSize;
        const newHeight = Math.ceil(block.clientHeight / this.gridSize) * this.gridSize;

        block.style.setProperty('width', `${newWidth}px`);
        /* block.style.setProperty('height', `${newHeight}px`); */

        this.updateBlockLinks(id);

        return block;
    }

    getJsonSchema() {
        let schema = {
            blocks: [],
            links: [],
        };

        for (let id in this.blocks) {
            let block = this.blocks[id];
            schema.blocks.push({
                id: id,
                title: block.title,
                description: block.description,
                x: block.x,
                y: block.y,
                color: block.color,
                file: block.file,
                additionalGridUnitsX: block.additionalGridUnitsX,
            });
        }

        for (let link of this.links) {
            schema.links.push({
                from: link[0],
                fromWhich: link[1],
                to: link[2],
                toWhich: link[3],
            });
        }

        return JSON.stringify(schema);
    }

    loadJsonSchema(schema) {
        this.blocks = {};
        this.links = [];

        for (let block of schema.blocks) {
            this.createAndInsertBlock(block.id, block.title, block.description, block.x, block.y, block.color, block.file, block.additionalGridUnitsX);
        }

        for (let link of schema.links) {
            this.connect(link.from, link.fromWhich, link.to, link.toWhich);
        }
    }
}

function clearBlockCreation() {
    modifyingBlock = null;
    document.getElementById('blockTitle').value = '';
    document.getElementById('blockDescription').innerHTML = '';
    document.querySelector('.colorSelector > #white').click();
    selectedFile = null;
    document.getElementById('post-file').value = '';
    document.querySelector('.drop-box').classList.remove('ready-to-send');
}

function createBlock() {
    const title = document.getElementById('blockTitle').value;
    const description = document.getElementById('blockDescription').innerHTML;
    let color = document.querySelector('.colorSelector > .selectedColor').id;
    let file = selectedFile ? selectedFile[0] : null || document.getElementById('post-file').files[0] || null;
    console.log(file);

    mindMap.createAndInsertBlock(crypto.randomUUID(), title, description, mindMap.addBlockCoords.x - 50, mindMap.addBlockCoords.y - 50, color, file);
    navbar('home');
    clearBlockCreation();
}

// TEST

const mindMap = new MindMapBoard(board, blocksGroup, linksGroup);

mindMap.createAndInsertBlock('test', 'Napoléon', '1769-1821', 25312, 25508);
mindMap.createAndInsertBlock('tdsfsdt', 'SES BATAILLES', '', 25396, 25508);
mindMap.createAndInsertBlock('tdsqsdqsdt', 'GRANDES VICTOIRES', '', 25396, 25508);
mindMap.createAndInsertBlock('tdssdqsfsfsdt', 'DEFAITES', '', 25396, 25508);
mindMap.createAndInsertBlock('tddfdgfdsfsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508);
mindMap.createAndInsertBlock('tdsfgdfgsdt', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25508);

mindMap.createAndInsertBlock('tests', 'test 1 qsdqsdq sqd', 'test 2', 25396, 25312);
mindMap.createAndInsertBlock('t', '1', '2', 25900, 25704);
/* mindMap.loadJsonSchema({ "blocks": [{ "id": "test", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25536, "y": 25088, "additionalGridUnitsX": 0 }, { "id": "tdsfsdt", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25536, "y": 25312, "additionalGridUnitsX": 0 }, { "id": "tdsqsdqsdt", "title": "test 1 qsdqsdq sqd", "description": "test 2q sdqsdqsd qsdqsdq sd qsd qsd", "x": 25452, "y": 25312, "additionalGridUnitsX": 0 }, { "id": "tdssdqsfsfsdt", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25760, "y": 25312, "additionalGridUnitsX": 0 }, { "id": "tddfdgfdsfsdt", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25536, "y": 24976, "additionalGridUnitsX": 0 }, { "id": "tdsfgdfgsdt", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25508, "y": 25200, "additionalGridUnitsX": 2 }, { "id": "tests", "title": "test 1 qsdqsdq sqd", "description": "test 2", "x": 25312, "y": 25312, "additionalGridUnitsX": 0 }, { "id": "t", "title": "1", "description": "2", "x": 26320, "y": 24332, "additionalGridUnitsX": 0 }], "links": [{ "from": "test", "fromWhich": "bottom", "to": "tdsfgdfgsdt", "toWhich": "top" }, { "from": "tddfdgfdsfsdt", "fromWhich": "top", "to": "t", "toWhich": "bottom" }] }); */
endLoading();
