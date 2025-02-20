import pinecone

def initialize_pinecone():
    try:
        print("Starting Pinecone initialization...")
        PINECONE_API_KEY = "pcsk_5ABHzg_MZbwuys3vPLRAbTsCo5bPUeeWXRQVVj2jbFPvGrd3qYsgYEgDJomgWx2wRrX4KB"
        print(f"API Key found: {PINECONE_API_KEY[:10]}...")

        # Create an instance of the Pinecone class
        pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
        print("Pinecone client initialized successfully")
        
        index_name = "soulmegle"
        print(f"Using index name: {index_name}")
        
        # Access the index
        index = pc.Index(index_name)
        print("Pinecone index accessed successfully")
        
        # Test the connection
        stats = index.describe_index_stats()
        print(f"Index stats: {stats}")
        
        return pc, index
    except Exception as e:
        print(f"Error initializing Pinecone: {e}")
        print(f"Error type: {type(e)}")
        return None, None 