-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the library_items table
create table if not exists public.library_items (
  id text primary key,
  category text not null,
  title text not null,
  book_title text,
  text text not null,
  source text,
  tags text[] default '{}',
  benefits text[] default '{}',
  embedding vector(1024), -- 1024 dimensions for Cloudflare's @cf/baai/bge-m3 embedding model
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable Row Level Security (RLS) so that the ingestion script can run using the public anon key
alter table public.library_items disable row level security;

-- Create an HNSW index for fast similarity search using Cosine distance
create index if not exists library_items_embedding_hnsw_idx 
  on public.library_items 
  using hnsw (embedding vector_cosine_ops);

-- Create the similarity match function for RAG queries
create or replace function match_library_items (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_category text default 'all'
)
returns table (
  id text,
  category text,
  title text,
  book_title text,
  text text,
  source text,
  tags text[],
  benefits text[],
  similarity float
)
language sql stable
as $$
  select
    library_items.id,
    library_items.category,
    library_items.title,
    library_items.book_title,
    library_items.text,
    library_items.source,
    library_items.tags,
    library_items.benefits,
    1 - (library_items.embedding <=> query_embedding) as similarity
  from library_items
  where (filter_category = 'all' or library_items.category = filter_category)
    and 1 - (library_items.embedding <=> query_embedding) > match_threshold
  order by library_items.embedding <=> query_embedding
  limit match_count;
$$;
