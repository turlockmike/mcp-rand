import { CallToolRequestSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

export const toolSpec = {
  name: 'generate_gaussian',
  description: 'Generate a random number following a Gaussian (normal) distribution between 0 and 1',
  inputSchema: {
    type: 'object' as const,
    properties: {}
  }
};

// Box-Muller transform to generate normally distributed random numbers
function generateGaussian(): number {
  let u1 = 0;
  let u2 = 0;
  
  // Avoid u1 being zero
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 <= Number.EPSILON);

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  // Convert from standard normal distribution (mean 0, std dev 1)
  // to a value between 0 and 1 using the error function (erf)
  // We add 1 and divide by 2 to shift from [-1,1] to [0,1]
  const normalized = (erf(z0 / Math.SQRT2) + 1) / 2;
  
  // Clamp to [0,1] in case of floating point errors
  return Math.max(0, Math.min(1, normalized));
}

// Error function approximation
// Abramowitz and Stegun approximation (maximum error: 1.5×10−7)
function erf(x: number): number {
  const sign = Math.sign(x);
  x = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * x);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));

  return sign * (1 - poly * Math.exp(-x * x));
}

export const generateGaussianHandler = async (
  _request: CallToolRequest
): Promise<CallToolResult> => {
  const gaussian = generateGaussian();
  
  return {
    content: [
      {
        type: 'text',
        text: gaussian.toString()
      }
    ]
  };
};