from django.shortcuts import render

def home_page_view(request):
    return render(request, 'pages/index.html')

def about_page_view(request):
    return render(request, 'pages/about.html')

def services_page_view(request):
    return render(request, 'pages/services.html')