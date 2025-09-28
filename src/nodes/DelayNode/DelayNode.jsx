import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';
import './DelayNode.css';

/**
 * A helper function to create a cancellable delay.
 * It resolves after a duration or rejects if the signal is aborted.
 * @param {number} duration_ms - The duration to wait in milliseconds.
 * @param {AbortSignal} signal - The signal to listen to for cancellation.
 */
const cancellableWait = (duration_ms, signal) => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    const timeoutId = setTimeout(resolve, duration_ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};


// 1. The LOGIC class
// ===========================================
export class DelayNodeLogic extends BaseNode {
  static type = 'delayNode';
  
  // These inputs/outputs are for control flow, not data.
  static inputs = { in_trigger: { dtype: 'string' } };
  static outputs = { out_flow: { dtype: 'string' } };

  /**
   * The core execution logic for the delay.
   * @param {object} inputs - The input data (not used here).
   * @param {AbortSignal} abortSignal - Passed from the orchestrator for cancellation.
   */
  async update(inputs, abortSignal) {
    const delaySeconds = parseInt(this.data.delay, 10) || 5;

    console.log(`[DelayNode ${this.id}] Starting ${delaySeconds}s delay.`);

    for (let i = delaySeconds; i > 0; i--) {
      // Update the UI with the current countdown value.
      // We only update the 'countdown' part of the runtime state.
      this.setState('running', { runtime: { ...this.runtime, countdown: i } });

      // Wait for 1 second, but listen for the abort signal.
      await cancellableWait(1000, abortSignal);
    }
    
    // Clear the countdown from the UI after finishing.
    this.setState('running', { runtime: { ...this.runtime, countdown: null } });
    console.log(`[DelayNode ${this.id}] Delay finished.`);
    
    // Return a value for the output handle to continue the flow.
    return { out_flow: inputs.in_trigger || ''};
  }
}


// 2. The UI component
// ===========================================
const DelayNodeComponent = ({ id, data }) => {
  const { onNodeConfigChange, runtime = {} } = data;
  const { status, countdown } = runtime;

  const [localDelay, setLocalDelay] = useState(data.delay || 5);

  useEffect(() => {
    setLocalDelay(data.delay || 5);
  }, [data.delay]);

  const handleDelayChange = (evt) => {
    setLocalDelay(evt.target.value);
  };

  const handleBlur = () => {
    if (onNodeConfigChange) {
      onNodeConfigChange(id, { delay: parseInt(localDelay, 10) });
    }
  };

  const isRunning = status === 'running';

  return (
    <BaseNodeComponent id={id} data={data} type={DelayNodeLogic.type}>
      <div className="delay-node-content">
        {isRunning && typeof countdown === 'number' ? (
          <div className="delay-node-countdown">
            Delaying... {countdown}s
          </div>
        ) : (
          <>
            <label htmlFor={`delay-input-${id}`}>Delay Duration (s)</label>
            <input
              id={`delay-input-${id}`}
              type="number"
              min="1"
              value={localDelay}
              onChange={handleDelayChange}
              onBlur={handleBlur}
              className="nodrag"
            />
          </>
        )}
      </div>
      <Handle type="target" position={Position.Left} id="in_trigger" data-dtype="string" />
      <Handle type="source" position={Position.Right} id="out_flow" data-dtype="string" />
    </BaseNodeComponent>
  );
};


// 3. The Configuration object
// ===========================================
export const DelayNodeConfig = {
  type: DelayNodeLogic.type,
  label: 'Delay',
  logic: DelayNodeLogic,
  component: memo(DelayNodeComponent),
  defaultData: {
    delay: 5, // Default delay of 5 seconds
  },
};