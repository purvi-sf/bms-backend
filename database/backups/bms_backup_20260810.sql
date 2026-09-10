--
-- PostgreSQL database dump
--

\restrict YXU9TYbYva5PmcTVklZ3szYMFxy2TiO4Kh1LQHlmdd2LfbFAl5rb7eVTVrxz8PJ

-- Dumped from database version 16.14 (Homebrew)
-- Dumped by pg_dump version 16.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authors; Type: TABLE; Schema: public; Owner: purvisonthalia
--

CREATE TABLE public.authors (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    bio text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.authors OWNER TO purvisonthalia;

--
-- Name: books; Type: TABLE; Schema: public; Owner: purvisonthalia
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    isbn character varying(20) NOT NULL,
    publish_date date,
    book_type character varying(10) NOT NULL,
    page_count integer,
    file_size character varying(20),
    author_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb,
    CONSTRAINT books_book_type_check CHECK (((book_type)::text = ANY ((ARRAY['Printed'::character varying, 'EBook'::character varying])::text[]))),
    CONSTRAINT books_page_count_check CHECK ((page_count > 0))
);


ALTER TABLE public.books OWNER TO purvisonthalia;

--
-- Name: author_stats; Type: VIEW; Schema: public; Owner: purvisonthalia
--

CREATE VIEW public.author_stats AS
 SELECT a.id,
    concat(a.first_name, ' ', a.last_name) AS author_name,
    count(b.id) AS total_books,
    count(
        CASE
            WHEN ((b.book_type)::text = 'Printed'::text) THEN 1
            ELSE NULL::integer
        END) AS printed_books,
    count(
        CASE
            WHEN ((b.book_type)::text = 'EBook'::text) THEN 1
            ELSE NULL::integer
        END) AS ebooks
   FROM (public.authors a
     LEFT JOIN public.books b ON ((a.id = b.author_id)))
  GROUP BY a.id, a.first_name, a.last_name;


ALTER VIEW public.author_stats OWNER TO purvisonthalia;

--
-- Name: authors_id_seq; Type: SEQUENCE; Schema: public; Owner: purvisonthalia
--

CREATE SEQUENCE public.authors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authors_id_seq OWNER TO purvisonthalia;

--
-- Name: authors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: purvisonthalia
--

ALTER SEQUENCE public.authors_id_seq OWNED BY public.authors.id;


--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: purvisonthalia
--

CREATE TABLE public.book_categories (
    book_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.book_categories OWNER TO purvisonthalia;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: purvisonthalia
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO purvisonthalia;

--
-- Name: books_full_detail; Type: VIEW; Schema: public; Owner: purvisonthalia
--

CREATE VIEW public.books_full_detail AS
 SELECT b.id,
    b.title,
    b.isbn,
    b.publish_date,
    b.book_type,
    b.page_count,
    b.file_size,
    concat(a.first_name, ' ', a.last_name) AS author_name,
    a.email AS author_email,
    string_agg((c.name)::text, ', '::text) AS categories
   FROM (((public.books b
     JOIN public.authors a ON ((b.author_id = a.id)))
     LEFT JOIN public.book_categories bc ON ((b.id = bc.book_id)))
     LEFT JOIN public.categories c ON ((bc.category_id = c.id)))
  GROUP BY b.id, b.title, b.isbn, b.publish_date, b.book_type, b.page_count, b.file_size, a.first_name, a.last_name, a.email;


ALTER VIEW public.books_full_detail OWNER TO purvisonthalia;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: purvisonthalia
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO purvisonthalia;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: purvisonthalia
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: purvisonthalia
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO purvisonthalia;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: purvisonthalia
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: authors id; Type: DEFAULT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.authors ALTER COLUMN id SET DEFAULT nextval('public.authors_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: purvisonthalia
--

COPY public.authors (id, first_name, last_name, email, bio, created_at) FROM stdin;
2	Frank	Herbert	frank@herbert.com	American science fiction author, best known for Dune.	2026-08-10 11:21:24.665101
3	George	Orwell	george@orwell.com	English novelist known for 1984 and Animal Farm.	2026-08-10 11:21:24.665101
4	J.R.R.	Tolkien	jrr@tolkien.com	English author of The Lord of the Rings.	2026-08-10 11:21:24.665101
5	Harper	Lee	harper@lee.com	American novelist known for To Kill a Mockingbird.	2026-08-10 11:21:24.665101
1	J.K.	Rowling	jkrowling@rowling.com	British author best known for the Harry Potter series.	2026-08-10 11:21:24.665101
6	Agatha	Christie	agatha@christie.com	English mystery writer.	2026-08-10 11:21:33.860038
\.


--
-- Data for Name: book_categories; Type: TABLE DATA; Schema: public; Owner: purvisonthalia
--

COPY public.book_categories (book_id, category_id) FROM stdin;
1	2
1	5
2	2
2	5
3	3
3	5
4	3
5	1
5	4
6	1
6	4
7	2
7	5
8	2
8	5
9	1
9	4
10	1
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: purvisonthalia
--

COPY public.books (id, title, isbn, publish_date, book_type, page_count, file_size, author_id, created_at, metadata) FROM stdin;
1	Harry Potter and the Philosophers Stone	9780747532743	1997-06-26	Printed	223	\N	1	2026-08-10 11:21:24.669209	\N
2	Harry Potter and the Chamber of Secrets	9780747538493	1998-07-02	EBook	\N	3.2	1	2026-08-10 11:21:24.669209	\N
4	Dune Messiah	9780425074268	1969-01-01	EBook	\N	2.8	2	2026-08-10 11:21:24.669209	\N
5	1984	9780451524935	1949-06-08	Printed	328	\N	3	2026-08-10 11:21:24.669209	\N
6	Animal Farm	9780451526342	1945-08-17	EBook	\N	1.5	3	2026-08-10 11:21:24.669209	\N
7	The Lord of the Rings	9780618640157	1954-07-29	Printed	1178	\N	4	2026-08-10 11:21:24.669209	\N
8	The Hobbit	9780547928227	1937-09-21	Printed	310	\N	4	2026-08-10 11:21:24.669209	\N
9	To Kill a Mockingbird	9780061935466	1960-07-11	Printed	281	\N	5	2026-08-10 11:21:24.669209	\N
10	Murder on the Orient Express	9780007119318	1934-01-01	Printed	256	\N	6	2026-08-10 11:21:33.860038	\N
3	Dune	9780441013593	1965-08-01	Printed	412	\N	2	2026-08-10 11:21:24.669209	{"awards": ["Hugo Award"], "edition": "First", "language": "English"}
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: purvisonthalia
--

COPY public.categories (id, name, description, created_at) FROM stdin;
1	Fiction	Literary works created from imagination.	2026-08-10 11:21:24.668458
2	Fantasy	Stories featuring magical and supernatural elements.	2026-08-10 11:21:24.668458
3	Science Fiction	Stories based on future science and technology.	2026-08-10 11:21:24.668458
4	Classic	Books considered of high literary merit over time.	2026-08-10 11:21:24.668458
5	Adventure	Stories involving exciting and dangerous journeys.	2026-08-10 11:21:24.668458
\.


--
-- Name: authors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: purvisonthalia
--

SELECT pg_catalog.setval('public.authors_id_seq', 6, true);


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: purvisonthalia
--

SELECT pg_catalog.setval('public.books_id_seq', 10, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: purvisonthalia
--

SELECT pg_catalog.setval('public.categories_id_seq', 5, true);


--
-- Name: authors authors_email_key; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_email_key UNIQUE (email);


--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (book_id, category_id);


--
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: idx_book_categories_book_id; Type: INDEX; Schema: public; Owner: purvisonthalia
--

CREATE INDEX idx_book_categories_book_id ON public.book_categories USING btree (book_id);


--
-- Name: idx_book_categories_category_id; Type: INDEX; Schema: public; Owner: purvisonthalia
--

CREATE INDEX idx_book_categories_category_id ON public.book_categories USING btree (category_id);


--
-- Name: idx_books_author_id; Type: INDEX; Schema: public; Owner: purvisonthalia
--

CREATE INDEX idx_books_author_id ON public.books USING btree (author_id);


--
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: purvisonthalia
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn);


--
-- Name: book_categories book_categories_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_categories book_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: books books_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: purvisonthalia
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YXU9TYbYva5PmcTVklZ3szYMFxy2TiO4Kh1LQHlmdd2LfbFAl5rb7eVTVrxz8PJ

