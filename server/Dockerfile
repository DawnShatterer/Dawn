FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Copy everything for preserving my project structure
COPY . .
# Restore
RUN dotnet restore "Dawn.Api/Dawn.Api.csproj"
# Build and publish
WORKDIR "/src/Dawn.Api"
RUN dotnet publish "Dawn.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Dawn.Api.dll"]
