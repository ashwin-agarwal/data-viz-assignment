import pandas as pd
import geopandas

# obtained data from Google
countries = {
    'BR': {'country': 'BR', 'country_name': 'Brazil', 'latitude': -15.749997, 'longitude': -51.92528}, 
    'CA': {'country': 'CA', 'country_name': 'Canada', 'latitude': 56.130366, 'longitude': -106.346771},
    'DE': {'country': 'DE', 'country_name': 'Germany', 'latitude': 51.165691, 'longitude': 10.451526},
    'FR': {'country': 'FR', 'country_name': 'France', 'latitude': 46.227638, 'longitude': 2.213749},
    'GB': {'country': 'GB', 'country_name': 'UK', 'latitude': 55.378051, 'longitude': -3.435973},
    'IN': {'country': 'IN', 'country_name': 'India', 'latitude': 20.593684, 'longitude': 78.96288},
    'JP': {'country': 'JP', 'country_name': 'Japan', 'latitude': 36.204824, 'longitude': 138.252924},
    'KR': {'country': 'KR', 'country_name': 'S Korea', 'latitude': 35.907757, 'longitude': 127.766922},
    'MX': {'country': 'MX', 'country_name': 'Mexico', 'latitude': 23.634501, 'longitude': -102.552784},
    'RU': {'country': 'RU', 'country_name': 'Russia', 'latitude': 61.52401, 'longitude': 105.318756},
    'US': {'country': 'US', 'country_name': 'USA', 'latitude': 37.09024, 'longitude': -95.712891}}

countries_df = pd.DataFrame(countries.values())

# reading the 1.2 GB CSV file
df = pd.read_csv('df_youtube_raw.csv')

df = df.drop(columns = [df.columns[0], 'publish_time', 'thumbnail_link', 
                         'ratings_disabled', 'comments_disabled', 'description'])

df = df.merge(countries_df, on='country')
df = df.drop(columns = ['country'])

df['views'] = pd.to_numeric(df['views'], downcast='integer')
df['likes'] = pd.to_numeric(df['likes'], downcast='integer')
df['dislikes'] = pd.to_numeric(df['dislikes'], downcast='integer')
df['comment_count'] = pd.to_numeric(df['comment_count'], downcast='integer')
df['trending_date'] = pd.to_datetime(df['trending_date'], format='%Y-%m-%d')

# keeping only the data after 2020-01-01
df = df.loc[df['trending_date'] > '2020-01-01']
df = df.dropna()

# transforming the tags to lower space
def transformTags(x):
    return x.strip().replace('"', '').replace('[None]', '').replace('[none]', '').lower().split('|')

df['tags'] = df['tags'].apply(transformTags)

# preparing data for bubble map

bubble_map_data = df.groupby(['country_name', 'latitude', 'longitude']).agg({'title': 'count'}).rename(columns = {'title': 'value'})

bubble_map_data.to_csv('bubble_map_data.csv', index = True)

#preparing data for doughnut

doughnut = df.groupby(['country_name', 'category_title']).agg({'title': 'count'}).rename(columns = {'title': 'count'}).reset_index()

doughnut = doughnut.merge(bubble_map_data, on = 'country_name').rename(columns = {'value' : 'total'})

doughnut['value'] = round(doughnut['count'] / doughnut['total'] * 100, 1)

doughnut.index = doughnut['country_name']

doughnut = doughnut.drop(columns = ['country_name', 'count', 'total'])

doughnut_temp = df.groupby(['category_title']).agg({'title': 'count'}).rename(columns = {'title': 'value'}).reset_index()

doughnut_temp['value'] = round(doughnut_temp['value'] / doughnut_temp.sum()['value'] * 100, 1)

doughnut_temp.index = ['Overall'] * doughnut_temp.shape[0]

doughnut_temp.index.name = 'country_name'

doughnut = doughnut.append(doughnut_temp)

main_list = []

for i in doughnut.index.unique():    
    as_list = doughnut.loc[i]['category_title'].tolist()
    
    for j in range(len(as_list)):        
        if doughnut.loc[i][doughnut.loc[i].category_title.str.contains(as_list[j])]['value'][0] < 3.5:
            as_list[j] = 'Others'

    main_list += as_list


doughnut['category_title'] = main_list

doughnut = doughnut.groupby(['country_name', 'category_title']).sum().round(1).sort_values(['country_name', 'value'], ascending = [True, False])

doughnut.to_csv('doughnut.csv', index = True)


# preparing data for word cloud

def flatList(x):
    return [item for sublist in x for item in sublist if len(item) > 1]

wordcloud = pd.DataFrame(df.groupby('country_name')['tags'].apply(list))

wordcloud = pd.DataFrame(wordcloud['tags'].apply(flatList))

wordcloud.loc['Overall'] = [[item for list in wordcloud['tags'].to_list() for item in list]]

def topNWords(x, n = 250):
    return pd.DataFrame(x[0]).value_counts().sort_values(ascending = False).head(n)

wordcloud = pd.DataFrame(wordcloud.groupby('country_name')['tags'].apply(topNWords)).reset_index().rename(columns = {0: 'words', 'tags': 'count'})

wordcloud.index = wordcloud.country_name

wordcloud[['words', 'count']].to_csv('wordcloud.csv', index = True)


# preparign data for bubble plot

temp = df.copy()

temp['likes_dislikes'] = temp['likes'] + temp['dislikes']

bubble_plot_data = temp.groupby(['country_name']).agg({'comment_count': 'mean', 'likes': 'mean', 'dislikes': 'mean', 'views': 'mean', 'likes_dislikes': 'mean'}).rename(columns = {'comment_count': 'comments'})

bubble_plot_data.to_csv('bubble_plot_data.csv', index = True)


# preparing data for stacked barplot

stacked_barplot = df.groupby(['country_name', 'category_title']).agg({'comment_count': 'mean', 'likes': 'mean', 'dislikes': 'mean', 'views': 'mean'}).rename(columns = {'comment_count': 'comments'})

overall_engagement = stacked_barplot.reset_index()

overall_engagement['country_name'] = overall_engagement['country_name'].apply(lambda x: "Overall")

overall_engagement = overall_engagement.groupby(['country_name', 'category_title']).agg({'comments': 'mean', 'likes': 'mean', 'dislikes': 'mean', 'views': 'mean'}).rename(columns = {'comment_count': 'comments'})

stacked_barplot = stacked_barplot.append(overall_engagement)

stacked_barplot['engagement_rate'] = round(((stacked_barplot['comments'] / stacked_barplot['views']) + \
                                    (stacked_barplot['likes'] / stacked_barplot['views']) + \
                                    (stacked_barplot['dislikes'] / stacked_barplot['views'])) * 100, 2)

stacked_barplot['total_engagement'] = stacked_barplot['comments'] + stacked_barplot['likes'] + stacked_barplot['dislikes']

for i in list(stacked_barplot.columns[:3]):
    stacked_barplot[i] = round(stacked_barplot[i] / stacked_barplot['total_engagement'] * 100, 2)

stacked_barplot = stacked_barplot.dropna()

stacked_barplot.iloc[:,:-1].to_csv('stacked_barplot.csv', index = True)


# preparing data for circular bar plot

def topNChannelsViews(x, n = 100,):
    return pd.DataFrame(x.sort_values(['views'], ascending = False).head(n)['channel_title'])

def topNChannelsVideos(x, n = 100,):
    return pd.DataFrame(x.sort_values(['videos'], ascending = False).head(n)['channel_title'])

circular_barplot = df.groupby(['country_name', 'channel_title', 'video_id']).agg({'views': 'max'}).reset_index().rename(columns={'video_id': 'videos'}).dropna()

circular_barplot = circular_barplot.groupby(['country_name', 'channel_title']).agg({'videos': 'count', 'views': 'mean'}).reset_index()

circular_barplot = circular_barplot.sort_values(['videos'], ascending = False).reset_index()

top_n_channels = circular_barplot.groupby('country_name').apply(topNChannelsViews)

top_n_channels = top_n_channels.append(circular_barplot.groupby('country_name').apply(topNChannelsVideos))

top_n_channels = top_n_channels.reset_index()['channel_title']

circular_barplot = circular_barplot[circular_barplot['channel_title'].isin(top_n_channels)].sort_values(['videos'], ascending = False)

circular_barplot.iloc[:,1:5].to_csv('circular_barplot.csv', index = False)


# preparing data for line chart

line_chart = df.groupby(['country_name', 'channel_title', 'video_id', 'category_title', 'trending_date']).agg({'views': 'max'}).reset_index().rename(columns={'video_id': 'videos'}).dropna()

line_chart = line_chart.groupby(['country_name', 'channel_title', 'category_title', 'trending_date']).agg({'videos': 'count', 'views': 'mean'}).reset_index()

line_chart = line_chart[line_chart['channel_title'].isin(list(circular_barplot['channel_title']))]

line_chart.to_csv('line_chart.csv', index = False)