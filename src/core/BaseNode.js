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
    
    this.inputs = this.constructor.inputs || {};
    this.outputs = this.constructor.outputs || {};
    
    this.id = id;
    this.data = nodeData;
    this._updateNodeState = updateNodeState;
    this._graph = graphContext;
    this._allLogicInstances = allLogicInstances;
    this._orchestrator = orchestrator; // New: Reference to the orchestrator

    this.runtime = { ...nodeData.runtime };
  }

  isOutputReady() {
    return this.runtime.status === 'completed';
  }

  isInputReady() {
    const parentEdges = this._graph.getAllEdges().filter(edge => edge.target === this.id);
    if (parentEdges.length === 0) return true;

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
   * NEW: Resets immediate parent nodes to 'pending' and re-queues them.
   * This is the engine for creating loops.
   */
  reReady() {
    console.log(`[Node ${this.id}] is calling reReady on its parents.`);
    const parentEdges = this._graph.getAllEdges().filter(edge => edge.target === this.id);
    parentEdges.forEach(edge => {
      const parentInstance = this._allLogicInstances.get(edge.source);
      if (parentInstance) {
        parentInstance.setState('pending');
        // Tell the orchestrator to consider this node for execution again.
        this._orchestrator.addToQueue(parentInstance);
      }
    });
  }

  /**
   * The execute method now accepts the AbortSignal from the orchestrator.
   * @param {AbortSignal} abortSignal 
   */
  async execute(abortSignal) {
    if (this.runtime.status !== 'pending' && this.runtime.status !== 'ready') return;

    // Check if the workflow was aborted before we even start.
    if (abortSignal.aborted) {
      this.setState('pending', { error: 'Cancelled before start' });
      return;
    }

    try {
      this.setState('running');
      const inputData = this._collectInputData();
      
      // --- CHANGE IS HERE: Pass the signal to the update method ---
      const outputData = await this.update(inputData, abortSignal);
      
      this.setState('completed', { output: outputData });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[Node ${this.id}] Execution was cancelled.`);
        // Reset to pending so it can run again in a future workflow.
        this.setState('pending', { error: 'Cancelled' });
      } else {
        console.error(`Error executing node ${this.id} (${this.constructor.name}):`, error);
        this.setState('error', { error: error.message });
        throw error; // Re-throw to let the orchestrator know about the failure.
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
  
  // To be implemented by subclasses
  async update(inputs) {
    throw new Error(`Method 'update()' must be implemented by subclass ${this.constructor.name}.`);
  }

  
}