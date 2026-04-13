Feedback
- 
- So when a workflow is run, it should show like loading that it is actually running the evaluation flow, making the api call, and tool calls, then when it is all done, the whole detailed view of the run Is basically there. 
- In the chat view, we should be able to see the mcp app ui loaded if an mcp app ui is actually called. Currently it just shows that an mcp app ui is called and doesn’t really display the actual ui. 
- If you add another expected tool call, the expected argument is not auto populated. 
- So the actual scenario library generated, just sort of seems like hardcoded data. The ai should be able to understand the tools available, and understand  what tools need to put together to come up with an anticipated  outcome. For example, the given scenario  is: User needs to retrieve sales revenue metrics for specific Indian states with monthly granularity. Now the user prompt is: Get me the revenue data for Maharashtra, Tamil Nadu, and Karnataka for 2024 on a monthly basis.              In the expected tool path, there is only the get-sales-data for example in this test, when you actually need way more to for the workflow to smoothly work together, so the implementation of the test generation can be actually better. As I said previously, let me reiterate the ai should able to understand what the tools are really doing and be able to come up with actual workable evals. 
- In one of the failed tests I ran, I am getting the trajectory as 0%, I can’t quite figure out what really that means, maybe because it failed, I can’t quite figure that out. 
- In one of the runs the ai made a tool call that is appropriate, but for some reason I am seeing, unexpected. 
- 
Tool · select-sales-metric
17ms • 4/12/2026, 8:56:50 PM
Reveal in Chat
unexpected
INPUT
{}
OUTPUT
{
  "content": [
    {
      "type": "text",
      "text": "Select Sales Metric Tool executed. Select input in the MCP App UI."
    }
  ],
  "isError": false,
  "responseTime": 16
}
RAW PAYLOAD
{
  "input": {},
  "output": {
    "content": [
      {
        "type": "text",
        "text": "Select Sales Metric Tool executed. Select input in the MCP App UI."
      }
    ],
    "isError": false,
    "responseTime": 16
  }
}
WIDGET RESOURCE
ui://sample-mcp-apps-chatflow/sales-metric-input-ui

￼

Ui optimizations
- The bogus curved radius scattered all around especially in the scenario, section, makes a little difficult for the user to really view the different things, it’s like it’s too much to done In such a way that is it not very easy for the user to view and navigate. 
- In the tools step, it is not very clear what match mode means.
- Also in the expected arguments, they should be mapped in such a way that users can basically see their different arguments and basically manipulate it, and tweak it, but it basically should have the expected arguments for a given specific mcp tool it should prefill based on it’s understanding of exactly what is expected from those tools. 

￼
- In this part it is difficult to view the whole name data here 
￼
- Make the json sections have nice coloring consistent with the rest of the json in the other parts of the app, like so. 
￼
- Also when you try to choose a tool, maybe when creating an evaluation scenario, make the tool selection a dropdown, not really a place where people can type. So they can easily switch between different tools, and the expected arguments auto populate. 
- I don’t know if these tags all around as a good idea maybe come up something else? That looks nicer, it’s a good idea yes, but maybe the ui around that can be different. 
- The users should be able to delete the test cases
- Also they should be able to leave the evaluation section by clicking on it again. Not necessarily by mcp apps or the chat tab to see the tools.


Just see how you can overall, smoothen all the rough edges. 
