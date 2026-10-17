import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq()

print("Chatbot Groq Streaming. Type 'quit', 'exit', or 'bye' to stop.")

while True:
    user_input = input("U: ")
    
    if user_input.lower() in ["quit", "exit", "bye"]:
        print("Chatbot: Goodbye!")
        break
        
    print("Chatbot: ", end="", flush=True)
    
    stream = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are a helpful chatbot."},
            {"role": "user", "content": user_input}
        ],
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="", flush=True)
            
    print() 