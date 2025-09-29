// src/core/BaseNode.js

export default class BaseNode {
  /**
   * @param {object} nodeData - The React Flow node's data object.
   * @param {string} id - The React Flow node's id.
   * @param {Function} updateNodeState - Callback to update the node's data in React state.
   * @param {object} graphContext - Object with methods to get allNodes and allEdges.
   * @param {Map<string, BaseNode>} allLogicInstances - Map of all live node instances.
   * @param {object} orchestrator - The workflow runner, with methods like addToQueue.
   */
  constructor(nodeData, id, updateNodeState, graphContext, allLogicInstances, orchestrator) {
    if (this.constructor === BaseNode) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    
    // Static outputs are still assigned directly.
    this.outputs = this.constructor.outputs || {};
    
    this.id = id;
    this.data = nodeData;
    this._updateNodeState = updateNodeState;
    this._graph = graphContext;
    this._allLogicInstances = allLogicInstances;
    this._orchestrator = orchestrator;

    this.runtime = { ...nodeData.runtime };

    // NEW: Defer input initialization to a dedicated method.
    // This allows subclasses to override it for dynamic behavior.
    this._initializeInputs();
  }
  
  /**
   * NEW: Initializes the node's inputs.
   * Subclasses can override this to create inputs dynamically based on `this.data`.
   * @protected
   */
  _initializeInputs() {
    this.inputs = this.constructor.inputs || {};
  }

  /**
   * NEW: A public method to be called when the node's data is updated from the UI.
   * This is the bridge between the React state and the logic instance.
   * @param {object} newData - The partial data object that has changed.
   */
  onDataUpdate(newData) {
    this.data = { ...this.data, ...newData };
    // Re-initialize inputs in case they depend on the new data.
    this._initializeInputs();
  }

  isOutputReady() {
    return this.runtime.status === 'completed';
  }

  isInputReady() {
    // This logic needs to know the defined inputs for the instance.
    const definedInputs = Object.keys(this.inputs);
    if (definedInputs.length === 0) return true; // Node with no inputs is always ready.

    const parentEdges = this._graph.getAllEdges().filter(edge => edge.target === this.id);
    const connectedInputs = new Set(parentEdges.map(edge => edge.targetHandle));

    // Check if all *defined* inputs are connected.
    const allInputsConnected = definedInputs.every(inputHandle => connectedInputs.has(inputHandle));
    if (!allInputsConnected) return false;

    // Check if all connected parents are ready.
    return parentEdges.every(edge => {
        const parentInstance = this._allLogicInstances.get(edge.source);
        return parentInstance && parentInstance.isOutputReady();
    });
  }
  
  /**
   * Sets the internal and external state of the node.
   * @param {string} status - 'pending', 'running', 'completed', 'error'
   * @param {object|null} data - Can contain 'output' or 'error' message.
   */
  setState(status, data = {}) {
    const newRuntimeState = { ...this.runtime, status, ...data };
    this.runtime = newRuntimeState;
    this._updateNodeState(this.id, { runtime: this.runtime });
  }

  /**
   * Resets immediate parent nodes to 'pending' and re-queues them.
   */
  reReady() {
    console.log(`[Node ${this.id}] is calling reReady on its parents.`);
    const parentEdges = this._graph.getAllEdges().filter(edge => edge.target === this.id);
    parentEdges.forEach(edge => {
      const parentInstance = this._allLogicInstances.get(edge.source);
      if (parentInstance) {
        parentInstance.setState('pending');
        this._orchestrator.addToQueue(parentInstance);
      }
    });
  }

  /**
   * The execute method.
   * @param {AbortSignal} abortSignal 
   */
  async execute(abortSignal) {
    if (this.runtime.status !== 'pending' && this.runtime.status !== 'ready') return;

    if (abortSignal.aborted) {
      this.setState('pending', { error: 'Cancelled before start' });
      return;
    }

    try {
      this.setState('running');
      const inputData = this._collectInputData();
      
      const outputData = await this.update(inputData, abortSignal);
      
      this.setState('completed', { output: outputData });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[Node ${this.id}] Execution was cancelled.`);
        this.setState('pending', { error: 'Cancelled' });
      } else {
        console.error(`Error executing node ${this.id} (${this.constructor.name}):`, error);
        this.setState('error', { error: error.message });
        throw error;
      }
    }
  }

  _collectInputData() {
    const parentEdges = this._graph.getAllEdges().filter(edge => edge.target === this.id);
    const collectedData = {};
    for (const edge of parentEdges) {
        const parentInstance = this._allLogicInstances.get(edge.source);
        if (parentInstance && parentInstance.runtime.output) {
            const parentOutputData = parentInstance.runtime.output;
            if (parentOutputData.hasOwnProperty(edge.sourceHandle)) {
                collectedData[edge.targetHandle] = parentOutputData[edge.sourceHandle];
            }
        }
    }
    return collectedData;
  }
  
  async update(inputs) {
    throw new Error(`Method 'update()' must be implemented by subclass ${this.constructor.name}.`);
  }
}