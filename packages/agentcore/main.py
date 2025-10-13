from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel

model_id = "ai21.jamba-1-5-mini-v1:0"
model = BedrockModel(
    model_id=model_id,
)
app = BedrockAgentCoreApp()
agent = Agent(
    model=model,
)

@app.entrypoint
def invoke(payload):
    """Your AI agent function"""
    user_message = payload.get("prompt", "Hello! How can I help you today?")
    result = agent(user_message)
    return {"result": result.message}

if __name__ == "__main__":
    app.run()