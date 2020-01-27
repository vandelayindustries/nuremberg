# Nuremberg

An AWS Lambda handler that

1. Fetches the last 7 days worth of Slack messages from the
   'vandelay-industries' DB.

2. Fetches the user's from Slack.

3. Upserts the user data into the database.
   
4. Then calculates the sentiment scores, message
   count, and toxic highlights. 

5. Saves the msg counts and sentiments for that time frame in the db.

6. Posts the results into a Slack channel.

