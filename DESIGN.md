# Surf Scheduler
Goal: Create a simple app that allows a user to track surf spots and be notified when the tide/swell criteria meet their preferences

The Problem: I can spend hours each week just trying to pick out when the tides are going to be good for certain spots and then I make a list of when the tides are going to cooperate.  I just want to put in my spot preferences and have a calendar so I can say, ok I'm surfing Pismo this week, when are my tide windows at the spots. 

## P0 Features
1. Select a surf spot, add a tide range preference
2. View dashboard where you toggle spots you are interested in for the month ahead.  The dashboard will show you the tide windows that you are interestedin. 
3. Additional surf details: For each of those tide windows pull the bouey data similar to surfline or surf-forecast and predict swell size as well as wind size. Show interpolated (sine wave like) tide chart


## Technology
1. Utilize https://api.tidesandcurrents.noaa.gov/api/prod/ or similar tide API, use interpolation to calculate 


## Deployment
1. Phase 1: local Expo development with a local Postgres DB (could be local supabase instance)
2. Phase 2: Deployed with Supabase for DB and using Expo, auth
3. Phase 3: Payments enabled platform