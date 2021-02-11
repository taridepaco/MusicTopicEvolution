# Lyric topic evolution

---
## Introduction
---

As in literature, the topics covered in song lyrics have evolved over time. One may think that it is easy to guess which are the most common but... Would that be correct? Let's find out!

Keep on reading to discover this interesting analysis performed, thanks to a Natural Language Processing topic model, over around 3700 song lyrics from the 40's until now. We will see which these topics are,  how their popularity evolved as the world changed through the decades and if any of them plumbered in a given time or suddenly appeared and skyrocketed from then (spoiler alert: a lot of "fuck, "shit" and "money" possibly involved in the latter topic).

Let's walk together through the complete creation process of this project where the different tools and decisions made along the way will be explained and (hopefully) justified, which may help understand the code (available in my github repository). \ref{}


---
## Method
---
### Tools

FIRST: Python.
If the meaning of life could be calculated, it would be programmed using Python. This object-oriented programming language has a massive amount of applications and is loved and appreciated among programmers. During the last decade or so, with the Big machine learning, A.I, and data science Bang, the popularity of Python has skyrocketed, since it is perfectly suitable for facing these problems due to its availability, huge community and resources created by enthusiastic people.

As if this was a "paella" recipe, in the list below you may find the Python libraries (tools) required for our purpose and their jobs.

- PyMongo. A Python library for dealing with NoSQL databases. The decision of using a NoSQL approach was a no-brainer due to the uncertainty of the path when it was started. The flexibility when creating and updating fields along the way exceeded the computing speed and organization advantages of a SQL counterpart. Additionally, PyMongo offers a free tier cloud based platform that perfectly fits this job.

- Requests. A web scraping library widely used in Python.

- Beautiful Soup 4. This one helps extracting data from the html file of the website obtained using the previous library. Very handy to automate pulling data contained in the same structures from lots of pages. In our case, collecting song titles in tables from Wikipedia documents.

- Urllib. I have used this library to generate API queries to the Genius portal. Very easy to use.

- Sklearn. One of the most used open-source machine learning libraries in Python. Very powerful for data analysis, however in the current project we only will be using it for transforming the bundle of lyrics to a matrix form, filtering out undesired words.

- Gensim. The core of the project. This open-source library built for Natural Language Processing and specially for topic modeling suits perfectly to our needs. We will use an LDA (Latent Dirichlet allocation) approach for the topic modeling.

Other useful Python libraries: 

- Matplotlib. Love it or hate it but very powerful for creating eye-catching plots and graphs.

- Regular Expressions. Feel like a movie hacker using this library. With a little practise, you will create time saving processes to find/replace text strings in a huge amount of documents. Perfect for data cleaning our lyric corpus of numbers, punctuation, gibberish and so on. VERY important for a proper work of the topic model.

- Numpy. Meant for working with number arrays and performing calculations and statistical functions.

- Pandas. Perfect for managing huge data frames where our lyric words will be. 

- Pickle. Used for locally save Python objects

- Scipy. A library for scientific computing, used here to create a sparse matrix.

### Gathering data

It is "exactly" like 10000 years ago when people used to gather fruit from the wilderness to survive. In our case, the internet is our own wilderness, fruit becomes data and instead of avoiding death by filling our guts, we avoid boredom by pleasing our curiosity.

The source of the songs selected for the study will be the year-end top single lists by Billboard, compiled in different Wikipedia documents from 1946 until 2020. If the first one is visited, it can be seen that the links to the rest are nicely packed near the footer of the page. Great, the first step will be scraping the page and saving these links for the next step.

Then, a database in MongoDB is initialized and from now on, all the info related to each lyric will be saved to the corresponding DB document. After that, the links from the previous step are consecutively scraped and, using beautiful soup, the title, artist name and year of each lyric is saved.

Now that the songs are compiled, a developer account from the lyric site Genius is created, since we will be using its API to perform a query and search each song by its title and artist. As usual, the response of the API consists of a JSON file which contains the URL of the lyric page (if found in their databases). An additional checking is performed; the title and artist name of the API response are compared with the ones of the original query to avoid incorrect mismatches. A Levenshtein distance algorithm will be employed for this purpose.

Finally, the lyric URLs are requested and the lyrics from them are added to our database corresponding document. A quick overview of random lyrics from the database would be helpful to check if this step is correctly complete (also, meaningful information of how to perform the upcoming data cleaning is extracted).

### Pre-processing the lyrics

From now on a Pandas DataFrame will be used for carrying the lyric collection info. So, the first step consists in creating a dataframe and populating it with the title, artist name, year and lyric of each song in our database. This file will be pickled as the processing continues.

Then, using RegEX, the lyrics are cleaned from numbers, punctuation marks, unrecognizable symbols and so on. Concractions (am -> 'm, not-> n't, etc) are repled with their fully form. This is done in order not to delete any information before the NLP model decides if that's necessary. Thanks to the overview of random lyrics performed in the previous step, it was detected that indicators of the lyric structure, such as CHORUS, [bridge], REPEAT, [outro], etc, always consisted in uppercase text or inside square brackets. So, using RegEx *One More Time*, any word consisting in 3 or more uppercase letters or inside square brackets are removed from the lyrics.

Now,a function from Sklearn called CountVectorizer is used to generate a matrix of tokens from the complete lyric collection. This powerful tool also allows specifying some parameters that become handy to filter out very common words (stopwords) present in most of the lyrics and the opposite, very unusual words which won't define a consistent topic. This function will be executed twice. 

The first one will be performed to obtain the words which are present in at least the 20% of the songs. The stopword list obtained is manually checked and merged to an english common stopword list. This mixed list will be used as an input parameter for the second round. 

For this second round an additional parameter is used: the minimum appearing frequency of words, which is fixed to 10. Hence, only words present in more than 10 lyrics and that are not contained in the previously generated stopword list will be taken into account. 

The parameters chosen for the beforementioned rounds produce a vocabulary size of around 3700 different words. This is an acceptable value that can work perfectly with the model that will be used in the upcoming section. Finally, to complete the pre-processing, the resulting DataFrame in matrix form of the tokenized lyrics (where each token represents a word that has passed the filters) is saved using the Pickle function.


### LDA model

First of all, the multi core function of this model was used, setting 4 workers to do the job, which reduced in half the computational time. The model also requires a dictionary (a vocabulary) with all the different words contained in our corpus and the corpus itself. From the preprocessing, the corpus is already in sparse matrix form, the correct form required by the LDA model.

For the number of passes (the equivalent of epoques from Machine Learning) and number of topics, a more complex method for picking these values is proposed as future work. In this project, multiple combination of these parameters were executed, finally selecting 5 topics and 100 passes for the results assessment. 

These parameters showed consistency. Increasing the number of topics produced the words of the topics collections to be mixed and repeated between them, decreasing the exclusivity of the words belonging to a single topic. A similar behavior was found when increasing the number of passes. 

The LDA model outputs a set of word lists that belong to a specific topic, however, labeling those topics remains as a manual task for the user. Nevertheless, after tuning the previous parameters, doing so becomes an easy task. Let's see some words of the topics modeled and which label was assigned to them.

|Example words																								|Chosen topic label	|
|-----------------------------------------------------------------------------------------------------------|------------------:|
|light, fire, rain, life, sun, sky, world, beautiful, soul, fly, wind, place, lights, free, shine			|*World beauty*		|
|feel, life, think, mind, hold, eyes, keep, better, nothing, stay, find, believe, alone, look, true			|*Feelings*			|
|shit, nigga, bitch, fuck, money, hit, bad, real, ass, watch, boy, low, ride, damn, big						|*Urban*			|
|man, girls, boy, home, mama, walk, young, work, boys, big, old, daddy, town, cool, pretty					|*People life*		|
|dance, body, tonight, shake, stop, rock, move, party, music, everybody, turn, beat, play, hands, floor		|*Dancing*			|

Once the model is fitted with the lyrics, it is straightforward to classify each song to a combination of topics depending on the words of its lyrics. Then, the values of the songs of each year are averaged, obtaining the topic popularity evolution across the years. 

---
## Results
---

At last, let's see some results! First, it seems interesting to extract some songs and the topics spoken in them.  


Some examples of topic modeling
	Evolution of topics in songs
