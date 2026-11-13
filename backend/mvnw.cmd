@echo off
setlocal
if exist "C:\Program Files\Java\jdk-22" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-22"
    set "PATH=C:\Program Files\Java\jdk-22\bin;%PATH%"
)
set "IDEA_MAVEN=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.1.1\plugins\maven\lib\maven3\bin\mvn.cmd"
if exist "%IDEA_MAVEN%" (
    call "%IDEA_MAVEN%" %*
) else (
    call mvn %*
)
