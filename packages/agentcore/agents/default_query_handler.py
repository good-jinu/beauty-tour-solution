ACTION_SYSTEM_PROMPT = """
You are a classifier that determines user intent. Analyze the user's query and respond with ONLY one word:
- "store" if the user wants to save, remember, or store information
- "retrieve" if the user is asking a question or wants to get information

Examples:
- "Remember that my birthday is July 25" -> store
- "What is my birthday?" -> retrieve
- "Save this information: I like pizza" -> store
- "Tell me about pizza" -> retrieve

Respond with only "store" or "retrieve".
"""

ANSWER_SYSTEM_PROMPT = """
You are a helpful assistant that answers questions based on information from a knowledge base.
Use the provided information to give accurate, helpful responses.
If the information is not sufficient, say so clearly.
"""

def determine_action(agent, query):
    """Determine if the query is a store or retrieve action for default queries."""
    result = agent.tool.use_llm(
        prompt=f"Query: {query}",
        system_prompt=ACTION_SYSTEM_PROMPT
    )

    # Clean and extract the action
    action_text = str(result).lower().strip()

    # Default to retrieve if response isn't clear
    if "store" in action_text:
        return "store"
    else:
        return "retrieve"

def process_default_query(agent, query):
    """Process a default query using the knowledge base workflow."""
    # Determine the action (store or retrieve)
    action = determine_action(agent, query)

    if action == "store":
        # Store the information
        agent.tool.memory(action="store", content=query)
        return "I've stored this information in the knowledge base."
    else:
        # Retrieve information
        try:
            # result = agent.tool.memory(
            #     action="retrieve",
            #     query=query,
            #     min_score=0.4,
            #     max_results=9
            # )

            # Generate response from retrieved information
            answer = agent.tool.use_llm(
                prompt=f"{query}",
                system_prompt=ANSWER_SYSTEM_PROMPT
            )
            return answer
        except Exception as e:
            return f"I encountered an issue retrieving information: {str(e)}"
