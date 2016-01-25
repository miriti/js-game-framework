define([
  'pixi',
  './extend',
  './index',
  './LoadingScreen'
],
function(PIXI,
        extend,
        framework,
        LoadingScreen) {

  var Game = function(width, height, virtualWidth, virtualHeight, container) {
    if(window.game) {
      console.warn("There is already a Game instance");
    }
    window.game = this;
    
    /** width of the game */
    this.width = width || 800;
    
    /** height of the game */
    this.height = height || 600;
    
    this.virtualWidth = virtualWidth || 0;
    this.virtualHeight = virtualHeight || 0;

    this.container = container || document.body;
    this.renderer = new PIXI.autoDetectRenderer(this.width, this.height);
    this.responsive = false;
    this.centered = true;
    this.prevTime = new Date().getTime();
    this.currentState = null;
    
    this.loadingScreen = new LoadingScreen();
    this.loader = PIXI.loader;
    this.resources = null;

    this._stateStack = [];
    this._savedStates = {};

    window.onresize = this.resize.bind(this);
    window.onkeydown = this.keyDown.bind(this);
    window.onkeyup = this.keyUp.bind(this);
    window.onkeypress = this.keyPress.bind(this);
    
    this.gameContainer = new framework.Container();
  };

  /**
   * Configure the game
   */
  Game.prototype.config = function(config) {
    for(var p in config) {
      this[p] = config[p];
    }

    return this;
  };
  
  /**
   * Set data that should be loaded before game run
   */
  Game.prototype.data = function(data) {
    for(var f in data) {
      this.loader.add(f, data[f]);
    }
    
    return this;
  };
  
  /**
   * Key down
   */
  Game.prototype.keyDown = function(event) {
    if(this.currentState && this.currentState['keyDown']) {
      this.currentState.keyDown(event.keyCode);
    }
  };
  
  Game.prototype.keyPress = function(event) {
    if(this.currentState && this.currentState['keyPress']) {
      this.currentState.keyPress(event.keyCode);
    }
  }
  
  /**
   * Key up
   */
  Game.prototype.keyUp = function(event) {
    if(this.currentState && this.currentState['keyUp']) {
      this.currentState.keyUp(event.keyCode);
    }
  };
  
  /**
   * Set current state
   */
  Game.prototype.setState = function(state, name) {
    if(this._savedStates[state]) {
      state = this._savedStates[state];
    }
    
    if(this.currentState) {
      this.gameContainer.removeChild(this.currentState);
    }
    this.currentState = state;
    this.gameContainer.addChild(this.currentState);
    this.resize();
    
    if(name) {
      this._savedStates[name] = state;
    }
    
    return this;
  };
  
  /**
   * Set state from stack
   */
  Game.prototype.popState = function() {
    var state = this._stateStack.pop();

    if (state) {
      this.setState(state);
    }

    return this;
  };

  /**
   * Push state to stack
   */
  Game.prototype.pushState = function(state) {
    this._stateStack.push(state);
    this.setState(state);

    return this;
  };

  /**
   * Resize happened
   */
  Game.prototype.resize = function() {
    var scale = 1;
    
    if (this.responsive) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      if(this.virtualWidth && this.virtualHeight) {
        scale = Math.min(this.height/this.virtualHeight, this.width / this.virtualWidth);
        this.gameContainer.scale.set(scale);
      }

      this.renderer.resize(this.width, this.height);
    }

    if (this.centered) {
      this.gameContainer.position.set(this.width / 2, this.height / 2);
        
      if(this.loadingScreen) {
        this.loadingScreen.position.set(this.width / 2, this.height / 2);
      }
    }
  };
  
  /**
   * Start the game
   */
  Game.prototype.run = function(callback) {
    this.container.appendChild(this.renderer.view);
    
    this.loader.on('progress', (function(loader, resource) {
      if(this.loadingScreen) {
        this.resize();
        this.loadingScreen.progress(loader);
        this.renderer.render(this.loadingScreen);
      }
    }).bind(this));
    
    this.loader.on('complete', (function(loader, resources) {
        this.resources = resources;
        this.resize();
        if(callback)
          callback.call(this);
        requestAnimationFrame(this.loop.bind(this));
      }).bind(this));
    
    this.loader.load();
    
    return this;
  };

  /**
   * Loop
   */
  Game.prototype.loop = function() {
    var currentTime = new Date().getTime();
    var delta = Math.min(((currentTime - this.prevTime) / 1000), (1 / 30));
    
    this.prevTime = currentTime;

    if(this.currentState) {
      this.gameContainer.update(delta);
      this.renderer.render(this.gameContainer);
    }

    requestAnimationFrame(this.loop.bind(this));
  };

  return Game;
});
