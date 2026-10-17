def introduction_bot():
    print("🤖 Hello! I'm IntroBot – your friendly introduction bot.")
    
    # Ask for user inputs
    name = input("👤 What's your name? ")
    age = input("🎂 How old are you? ")
    language = input("💻 What's your favorite programming language? ")

    # Print a personalized message
    print("\n--- INTRODUCTION SUMMARY ---")
    print(f"Nice to meet you, {name}! 👋")
    print(f"You're {age} years old and you love coding in {language}. That's awesome!")
    print("Keep learning and coding. 🚀")

# Run the bot
introduction_bot()
