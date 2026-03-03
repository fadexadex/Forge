### Initial Idea Submission

**Full Name:** Daniel Fadehan  
**University name:** Redeemer's University  
**Program you are enrolled in:** Computer Science  
**Year:** 3rd year  
**Expected graduation date:** 2027  

**Project Title:** MCP Testing  

**Idea description:**

The Model Context Protocol (MCP) acts as the API layer of the AI world, defining a standard way for AI agents to discover, understand, and interact with tools, data, and software systems - much like REST or GraphQL do for traditional applications.

In this project, my task is to strengthen the MCP Developer ecosystem by designing and building the capability to intuitively create and comprehensively test MCP servers and clients.

My approach breaks down the lifecycle into three primary pillars: 
1. Server Creation
2. Server Testing (Building on MCP Inspector)
3. Client / LLM Testing Integration

#### 1. Creating an MCP Server

The first phase focuses on providing users with an intuitive way to construct and define how their MCP server should operate. 

* **Visual/Logical Workflow:** Users will have the ability to connect different components to define the logic of their MCP server. This includes setting up condition flows, defining specific tasks, and configuring external API requests.
* **Input and Output Definition:** Users can clearly define the expected inputs (parameters) and the corresponding outputs for their server's tools and resources.
* **Server Architecture Flow:** The UI will clearly represent the architecture and the steps the server will execute when called.

> **[Image Placeholder: UI Mockup of the Server Creation/Connection Flow]**  
> *Description of image to attach: A visual interface showing the flow of creating/configuring an MCP server. It should display elements for defining API requests, condition flows, input/output definitions, and how the different server components connect logcially.*

#### 2. Server Testing (Extending the MCP Inspector)

Once a server is created or connected, users need a robust environment to verify its internal logic independently of an AI model, ensuring the MCP setup is valid.

* **Bridging the Architecture:** This phase will document and implement the bridge between the created server logic and the testing environment.
* **Enhanced MCP Inspector Workflow:** I plan to build on top of the existing testing workflow provided by the official MCP Inspector. 
* **Dedicated Testing UI:** A new, streamlined UI will be integrated to facilitate testing. Users will be able to inspect and manually interact with the different elements exposed by the server—such as tools, prompts, and resources—ensuring that the server correctly responds with the expected data.

#### 3. Client Testing (LLM Integration)

The ultimate test for an MCP server is its capability to be correctly utilized by an AI model. This third phase introduces a built-in MCP client experience to test the server end-to-end.

* **Provider Integration:** Users will be provided with a UI to plug in their own API keys to connect to specific LLM providers.
* **AI Client Interface:** The application will essentially serve as an MCP client for the chosen Large Language Model. Users can seamlessly connect their previously created/tested MCP server to this AI client.
* **Interactive Chat Testing:** Users will be provided with a chat interface to communicate directly with the LLM. By directly prompting the LLM, users can verify that the model correctly understands the server's attached capabilities, successfully makes autonomous calls to the MCP server's tools, and processes the responses accurately. This guarantees that the MCP server works perfectly in a real-world scenario.

---

**Skills:** AI, Python, React, Node, TypeScript  
**Difficulty:** Medium-High  
**Length:** 175 hours  

**Idea discussion thread** - #1225
