# Lyric topic evolution

## Introduction

As in literature, the topics covered in song lyrics have evolved over time. One may thik that it is easy to guess which are the most common but... Would that be correct? Let's find out!

Keep on reading to discover this interesting analysis performed, thanks to a Natural Language Processing topic model, over around 3700 song lyrics from the 40's until now. We will see which these topics are,  how their popularity evolved as the world changed thorugh the decades and if any of them plumbered in a given time or suddenly appeared and skyrocketed from then (spiler alert: a lot of "fuck, "shit" and "money" possibly involved in the latter topic).

Let's walk together thorugh the complete creation process of this project where the different tools and decisions made along the way will be explained and (hopefully) justified, which may help understand the code (available in my github repository). \ref{}



## Method

### Tools

FIRST: Python.
If the meaning of life could be calculated, it would be programmed using Python. This object-oriented programming language has a massive amount of applications and is loved and appreciated among programmers. During the last decade or so, with the Big machine learning, A.I, and data science Bang, the popularity of Python has skyrocketed, since it is perfectly suitable for facing these problems due to its availability, huge community and resources created by enthusiastic people.

As if this was a "paella" recipe, in the list below you may find the Python libraries (tools) required for our purpose and their jobs.

- PyMongo. A Python library for dealing with NoSQL data bases. The decision of using a NoSQL approach was a no-brainer due to the uncertainty of the path when it was started. The flexibility when creating and updating fields along the way exceeded the computing speed and organization advantages of a SQL counterpart. Additionally, PyMongo offers a free tier cloud based platform that perfectly fits for this job.

- Requests. A web scrapping library widely used in Python.

- Beautiful Soup 4. This one helps extracting data from the html file of the website obtained using the previous libary. Very handy to automiatize pulling data contained in the same structures from lot of pages. In our case, collecting song titles in tables from Wikipedia documents.

- Urllib. I have used this library to generate API queries to the Genius portal. Very easy to use.

- Sklearn. One of the most used open-source machine learning libraries in Python. Very powerful for data analysis, however in the current project we only will be using it for transforming the bundle of lyrics to a matrix form, filtering out undesired words.

- Gensim. The core of the project. This open-source library built for Natural Language Processing and spetially for topic modelling suits perfectly to our needs. We will use an LDA (Latent Dirichlet allocation) approach for the topic modelling.

Other useful Python libraries: 

- Matplotlib. Love it or hate it but very powerful for creating eye-catching plots and graphs.

- Regular Expressions. Feel like a movie hacker using this library. With a little practise, you will create time saving processes to find/replace text strings in a huge amounts of documents. Perfect for data cleaning our lyric corpus of numbers, punctuation, gibberish and so on. VERY important for a proper work of the topic model.

- Numpy. Meant for working with number arrays and perform calculations and statistical functions.

- Pandas. Perfect for managing huge data frames were our lyric words will be. 

- Pickle. Used for locally save Python objects

- Scipy. A library for scientific computing, used here to create a sparse matrix.

### Gathering data

It is "exactly" like 10000 year ago when people used to gather fruit from the wilderness to survive. In our case, the internet is our own wilderness, fruit becomes data and instead of avoiding death by filling our guts, we avoid boredom by pleasing our curiosity.

The source of the songs selected for the study will be the year-end top single lists by Billboard, compiled in different wikipedia documents from 1946 until 2020. If the first one is visited, it can be seen that the links to rest is nicely pack near the footer of the page. Great, the first step will be scrapping the page and saving these links for the next step.

A database in MongoDB is initialized and from now on, all the info related to each lyric will be saved to the corresponding DB document. The links from the previous step are consecutively scrapped and, using beautiful soup, the title, artist name and year of each lyric is saved.

Now that the song are compiled, a developer account from the lyric site Genius is created, since we will be using its API to perform a query and search each song by its title and artist. As usually, the response of the API consist in a JSON file which contains the URL of the lyric page (if found in their databases). An additional checking is perfomed; the title and artist name of the API response are compared with the one of the original query to avoid incorrect mismatchings. A Levenshtein distance algorithm will be employed for this purpose.

Finally, the lyric URLs are requested and the lyrics from them are added to our database corresponding document.

### Pre-processing
- stopword list
- min and max words in documents filtering
- Final bag of words count

### LDA model
- number of topics
- number of passes
- labeling
	
## Results
Some examples of topic modelling
	Evolution of topics in songs