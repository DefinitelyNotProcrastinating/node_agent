import { TextNodeConfig } from './TextNode/TextNode';
import { LLMNodeConfig } from './LLMNode/LLMNode';
import { ConcatNodeConfig } from './ConcatNode/ConcatNode';
import { TextDisplayNodeConfig } from './TextDisplayNode/TextDisplayNode';
import { DelayNodeConfig } from './DelayNode/DelayNode'; // <-- ADD THIS IMPORT

const nodeRegistry = {
  [TextNodeConfig.type]: TextNodeConfig,
  [LLMNodeConfig.type]: LLMNodeConfig,
  [ConcatNodeConfig.type]: ConcatNodeConfig,
  [TextDisplayNodeConfig.type]: TextDisplayNodeConfig,
  [DelayNodeConfig.type]: DelayNodeConfig, // <-- ADD THIS ENTRY
};

export default nodeRegistry;